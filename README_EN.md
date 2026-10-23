# CodeBuddy Desktop

[中文](README.md)

Self-contained Windows desktop client for [CodeBuddy Code](https://www.npmjs.com/package/@tencent-ai/codebuddy-code) (Tencent CodeBuddy CLI).

> **Disclaimer**: This project is not a reverse-engineering or cracking effort. It is simply a client-side wrapper around CodeBuddy that allows users to conveniently launch the CLI and run it in the background with one click. All code is based on the officially published npm package and the Electron framework, with no reverse engineering or copyright circumvention involved. Users can rest assured.

Download, double-click, and you are in. CodeBuddy CLI starts with the app and the Web UI opens automatically — nothing else to install, configure, or prepare.

## Features

- **One-click start** — double-click the shortcut, the CLI server starts and the Web UI opens
- **Tray-resident** — closing the window minimizes to system tray; click tray icon to restore
- **Background service** — the CLI runs hidden and survives window close; auto-restarts on crash
- **Full access** — `fullAccess` permission mode by default
- **Single instance** — launching twice just focuses the existing window
- **Auto-login** — reads gateway password from `~/.codebuddy/settings.json`
- **Boot auto-start** — toggle from the tray menu
- **Self-contained** — the CLI binary runs via Electron's built-in Node.js runtime (`ELECTRON_RUN_AS_NODE`)

## Download

Grab the latest installer from [Releases](../../releases):

| File | Description |
|------|-------------|
| `codebuddy-desktop-Setup-x.x.x.exe` | NSIS installer (recommended) |
| `codebuddy-desktop-x.x.x-Portable.exe` | Portable single-file exe |

## Install

1. Download and run the installer
2. A desktop shortcut and Start Menu entry are created automatically
3. Double-click **CodeBuddy Desktop** to start

## Tray Menu

| Action | Behavior |
|--------|----------|
| Open main window | Show/focus the app window |
| Service running | Status indicator |
| Restart service | Kill and re-spawn the CLI |
| Stop service | Stop the CLI |
| Boot auto-start | Toggle launch at Windows startup |
| Open log directory | Open the folder containing `server.log` |
| Quit | Stop service (if this app started it) and exit |

## Development

```bash
git clone https://github.com/liujuntao123/codebuddy-desktop.git
cd codebuddy-desktop
npm install        # installs electron + electron-builder
npm run prepare    # downloads CodeBuddy CLI into vendor/
npm start          # launches the app in dev mode
```

### Build distributables locally

```bash
npm run dist       # prepare vendor + electron-builder --win
```

Output goes to `dist/`.

### Project structure

```
├── main.js               # Electron main process
├── electron-builder.yml  # Build configuration
├── scripts/
│   ├── prepare-vendor.js     # downloads the pinned CLI for dev / CI
│   └── bump-cli-version.js   # bumps bundled CLI version + CHANGELOG
├── build/
│   ├── icon.ico          # Windows app icon
│   └── icon.png          # Tray icon
├── vendor/               # (gitignored) CodeBuddy CLI runtime
│   └── codebuddy-code/
└── .github/workflows/
    ├── build.yml           # CI: build + release on tag push
    └── auto-update-cli.yml # CI: daily CLI version check → release
```

The bundled CLI version is pinned in `package.json` (`codebuddyCliVersion`); `prepare-vendor.js` installs exactly that version and `build.yml` fails if the downloaded version differs.

### Release workflow

1. Update `CHANGELOG.md` with a new `[x.y.z]` section
2. Update `version` in `package.json`
3. Commit and tag:
   ```bash
   git add -A && git commit -m "release: v1.1.0"
   git tag v1.1.0
   git push origin main --tags
   ```
4. GitHub Actions builds NSIS + portable exes and creates a Release with the changelog

### Automatic CLI updates

`auto-update-cli.yml` checks npm for a newer `@tencent-ai/codebuddy-code` daily at 03:00 UTC. When one exists it bumps `codebuddyCliVersion` and the app patch version, writes a CHANGELOG entry, rebuilds, and only after a successful build commits, tags and publishes a Release. It can also be run manually from the Actions tab.

## License

[MIT](LICENSE) — the bundled CodeBuddy Code CLI is subject to its own [license](https://www.npmjs.com/package/@tencent-ai/codebuddy-code).
