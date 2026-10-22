# CodeBuddy Harness

Self-contained Windows desktop client for [CodeBuddy Code](https://www.npmjs.com/package/@tencent-ai/codebuddy-code) (腾讯 CodeBuddy CLI).

Bundles the full CodeBuddy CLI (~280MB) inside the app — **zero external dependencies**. No Node.js, no npm, no global install required on the target machine.

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
| `CodeBuddy-Harness-Setup-x.x.x.exe` | NSIS installer (recommended) |
| `CodeBuddy-Harness-x.x.x-Portable.exe` | Portable single-file exe |

## Install

1. Download and run the installer
2. A desktop shortcut and Start Menu entry are created automatically
3. Double-click **CodeBuddy Harness** to start

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
git clone https://github.com/liujuntao123/codebuddy-harness.git
cd codebuddy-harness
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
│   └── prepare-vendor.js # Downloads CLI for local dev / CI
├── build/
│   ├── icon.ico          # Windows app icon
│   └── icon.png          # Tray icon
├── vendor/               # (gitignored) CodeBuddy CLI runtime
│   └── codebuddy-code/
└── .github/workflows/
    └── build.yml         # CI: build + release on tag push
```

### Release workflow

1. Update `CHANGELOG.md` with a new `[x.y.z]` section
2. Update `version` in `package.json`
3. Commit and tag:
   ```bash
   git add -A && git commit -m "release: v1.0.0"
   git tag v1.0.0
   git push origin main --tags
   ```
4. GitHub Actions builds NSIS + portable exes and creates a Release with the changelog

## License

[MIT](LICENSE) — the bundled CodeBuddy Code CLI is subject to its own [license](https://www.npmjs.com/package/@tencent-ai/codebuddy-code).
