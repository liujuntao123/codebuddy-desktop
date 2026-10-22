// codebuddy-desktop — Electron main process.
// Self-contained client: bundles the CodeBuddy CLI (vendor/codebuddy-code).
// The CLI is executed with Electron's own node binary (ELECTRON_RUN_AS_NODE),
// so no system Node, npm install or global codebuddy is required.
//
// Window lifecycle: closing the window hides it to the system tray; clicking
// the tray icon (or "打开主窗口") restores it. "退出" stops the server if this
// app started it.
const { app, BrowserWindow, Tray, Menu, dialog, nativeImage, shell } = require('electron');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const APP_ROOT = IS_PACKAGED ? path.dirname(process.execPath) : __dirname;
const IS_PACKAGED = app.isPackaged;
// In dev: vendor/ sits next to main.js; in packaged builds, extraResources
// places it under resources/codebuddy-code (outside the asar archive).
const CLI_BIN = IS_PACKAGED
  ? path.join(process.resourcesPath, 'codebuddy-code', 'bin', 'codebuddy')
  : path.join(__dirname, 'vendor', 'codebuddy-code', 'bin', 'codebuddy');
const ICON_PNG = path.join(__dirname, 'build', 'icon.png');
const SERVER_LOG = IS_PACKAGED
  ? path.join(app.getPath('userData'), 'server.log')
  : path.join(__dirname, 'server.log');

let win = null;
let tray = null;
let serverProc = null;
let weStarted = false;
let manualStop = false;
let gwPassword = '';
let serverUp = false;

function log(line) {
  try { fs.appendFileSync(SERVER_LOG, `[${new Date().toISOString()}] ${line}\n`); } catch (_) { /* ignore */ }
}

function readGwPassword() {
  try {
    const settings = JSON.parse(fs.readFileSync(path.join(app.getPath('home'), '.codebuddy', 'settings.json'), 'utf8'));
    return (settings.gateway && settings.gateway.password) || '';
  } catch (_) { return ''; }
}

function apiGet(urlPath, cb) {
  const headers = { 'x-codebuddy-request': '1' };
  if (gwPassword) headers.Authorization = 'Bearer ' + gwPassword;
  const req = http.get({ host: '127.0.0.1', port: PORT, path: urlPath, headers, timeout: 3000 }, (res) => {
    let body = '';
    res.on('data', (c) => { body += c; });
    res.on('end', () => {
      let json = null;
      try { json = JSON.parse(body || 'null'); } catch (_) { /* ignore */ }
      cb(null, json, res.statusCode);
    });
  });
  req.on('error', () => cb(new Error('network')));
  req.on('timeout', () => { req.destroy(); cb(new Error('timeout')); });
}

function checkHealthy(cb) {
  apiGet('/api/v1/health', (err, body, status) => {
    cb(!err && status === 200);
  });
}

function listenerPid() {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess"`,
      { encoding: 'utf8', windowsHide: true }
    ).trim();
    const pid = parseInt(out, 10);
    return Number.isFinite(pid) && pid > 0 ? pid : null;
  } catch (_) { return null; }
}

function killTree(pid) {
  if (!pid) return;
  try { execSync(`taskkill /PID ${pid} /T /F`, { windowsHide: true, stdio: 'ignore' }); } catch (_) { /* already gone */ }
}

function spawnServer() {
  const args = [
    CLI_BIN, '--serve', `--port=${PORT}`, '--agent', 'cli',
    '--permission-mode', 'fullAccess',
  ];
  serverProc = spawn(process.execPath, args, {
    env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' }),
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: require('os').homedir(),
  });
  weStarted = true;
  manualStop = false;
  const startedAt = Date.now();
  const logStream = fs.createWriteStream(SERVER_LOG, { flags: 'a' });
  logStream.write(`\n[${new Date().toISOString()}] === spawning bundled CLI (pid ${serverProc.pid}) ===\n`);
  serverProc.stdout.on('data', (d) => logStream.write(d));
  serverProc.stderr.on('data', (d) => logStream.write(d));
  serverProc.on('exit', (code) => {
    logStream.write(`[${new Date().toISOString()}] CLI exited with code ${code}\n`);
  serverUp = false;    serverProc = null;
    if (tray) refreshTrayMenu();
    // Resilience: if the server dies on its own (not a manual stop / quit),
    // restart it automatically. Give up after 3 quick failures in a row.
    if (!app.isQuitting && !manualStop) {
      const quick = Date.now() - startedAt < 15000;
      crashStreak = quick ? crashStreak + 1 : 0;
      if (crashStreak >= 3) {
        log('server crashed 3x quickly; auto-restart disabled until manual restart');
        return;
      }
      log('server exited unexpectedly; restarting in 2s');
      setTimeout(() => startServer((err) => {
        if (err) log('auto-restart failed: ' + err.message);
        refreshTrayMenu();
      }), 2000);
    }
  });
}

let crashStreak = 0;

function waitForHealthy(left, cb) {
  if (left <= 0) return cb(new Error('server did not become healthy in time (see server.log)'));
  setTimeout(() => {
    checkHealthy((ok) => {
      if (ok) return cb(null);
      waitForHealthy(left - 1, cb);
    });
  }, 500);
}

function startServer(cb) {
  checkHealthy((ok) => {
    if (ok) {
      weStarted = false;
      serverUp = true;
      log('reusing healthy server already listening on port ' + PORT);
      return cb(null, 'reused');
    }
    if (!fs.existsSync(CLI_BIN)) {
      return cb(new Error('bundled CLI not found: ' + CLI_BIN));
    }
    // A stale/foreign listener would block our port: clear it first.
    const pid = listenerPid();
    if (pid) {
      log('port ' + PORT + ' held by unhealthy pid ' + pid + ', stopping it');
      killTree(pid);
    }
    spawnServer();
    waitForHealthy(60, (err) => {
      if (err) return cb(err);
      serverUp = true;
      cb(null, 'started');
    });
  });
}

function stopServer(cb) {
  manualStop = true;
  if (serverProc && weStarted) {
    killTree(serverProc.pid);
    serverProc = null;
    weStarted = false;
  } else {
    const pid = listenerPid();
    if (pid) killTree(pid);
  }
  serverUp = false;
  if (cb) setTimeout(cb, 500);
}

function webRoot() {
  return `http://127.0.0.1:${PORT}/` + (gwPassword ? `?password=${encodeURIComponent(gwPassword)}` : '');
}

function createWindow() {
  win = new BrowserWindow({
    width: 1460,
    height: 920,
    minWidth: 980,
    minHeight: 640,
    icon: ICON_PNG,
    title: 'codebuddy-desktop',
    backgroundColor: '#16181d',
    autoHideMenuBar: true,
    show: false,
  });
  win.setMenu(null);
  const target = webRoot();
  log('loading ' + target.replace(/password=[^&]*/, 'password=***'));
  win.loadURL(target);
  win.once('ready-to-show', () => { win.show(); win.focus(); });
  win.webContents.on('did-finish-load', () => {
    log('window loaded: ' + win.webContents.getURL().replace(/password=[^&]*/, 'password=***'));
  });
  // Close button hides to tray instead of quitting.
  win.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
      if (tray) tray.displayBalloon ? null : null; // no-op; keep quiet
    }
  });
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && (input.key === 'F5' || (input.control && input.key === 'r'))) {
      win.webContents.reload();
      event.preventDefault();
    } else if (input.type === 'keyDown' && input.key === 'F12') {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
  win.on('closed', () => { win = null; });
}

function autoLaunchEnabled() {
  try {
    const s = app.getLoginItemSettings({ path: process.execPath, args: [APP_ROOT] });
    return !!s.openAtLogin;
  } catch (_) { return false; }
}

function setAutoLaunch(v) {
  try {
    app.setLoginItemSettings({ openAtLogin: v, path: process.execPath, args: [APP_ROOT] });
  } catch (_) { /* ignore */ }
}

function showWindow() {
  if (!win) return createWindow();
  win.show();
  win.focus();
}

function refreshTrayMenu() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    { label: '打开主窗口', click: () => showWindow() },
    { type: 'separator' },
    { label: serverUp ? `服务运行中 · 127.0.0.1:${PORT}` : '服务未运行', enabled: false },
    {
      label: '重启服务',
      click: () => {
        stopServer(() => startServer((err) => {
          if (err) dialog.showErrorBox('codebuddy-desktop', '重启服务失败: ' + err.message);
          refreshTrayMenu();
          if (win && !err) win.loadURL(webRoot());
        }));
      },
    },
    {
      label: '停止服务',
      click: () => stopServer(() => refreshTrayMenu()),
    },
    { type: 'separator' },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: autoLaunchEnabled(),
      click: (item) => setAutoLaunch(item.checked),
    },
    {
      label: '打开日志目录',
      click: () => shell.openPath(APP_ROOT),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => { app.isQuitting = true; app.quit(); },
    },
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip('codebuddy-desktop · ' + (serverUp ? '运行中' : '已停止'));
}

function createTray() {
  let image = nativeImage.createFromPath(ICON_PNG);
  if (image.isEmpty()) image = nativeImage.createEmpty();
  tray = new Tray(image);
  tray.on('click', () => showWindow());
  refreshTrayMenu();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());

  app.whenReady().then(() => {
    gwPassword = readGwPassword();
    log('=== codebuddy-desktop starting ===');
    startServer((err, how) => {
      if (err) {
        log('server start failed: ' + err.message);
        dialog.showErrorBox('codebuddy-desktop', '服务启动失败:\n' + err.message + '\n\n日志: ' + SERVER_LOG);
      } else {
        log('server ' + how);
      }
      createWindow();
      createTray();
    });
  });

  app.on('window-all-closed', () => { /* stay in tray */ });

  app.on('before-quit', () => {
    app.isQuitting = true;
    if (weStarted) {
      log('quitting: stopping server we started');
      stopServer();
    } else {
      log('quitting: server was reused, leaving it running');
    }
  });
}
