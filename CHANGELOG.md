# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.8] - 2026-10-31

### Changed
- Bundled CodeBuddy CLI updated to `2.179.0`

## [1.2.7] - 2026-10-29

### Changed
- Bundled CodeBuddy CLI updated to `2.178.1`

## [1.2.6] - 2026-10-28

### Changed
- Bundled CodeBuddy CLI updated to `2.177.1`

## [1.2.5] - 2026-10-27

### Changed
- Bundled CodeBuddy CLI updated to `2.177.0`

## [1.2.4] - 2026-10-26

### Changed
- Bundled CodeBuddy CLI updated to `2.176.0`

## [1.2.3] - 2026-10-25

### Changed
- Bundled CodeBuddy CLI updated to `2.175.0`

## [1.2.2] - 2026-10-24

### Changed
- Bundled CodeBuddy CLI updated to `2.174.0`

## [1.2.1] - 2026-10-23

### Changed
- Bundled CodeBuddy CLI updated to `2.173.0`

## [1.2.0] - 2026-10-23

### Added
- `auto-update-cli.yml`: daily check of npm for a newer bundled CLI, then bump → build → tag → release
- Bundled CLI version pinned in `package.json` (`codebuddyCliVersion`); `build.yml` verifies it matches the download

### Changed
- Port selection now tries the ports the CLI remembers in `~/.codebuddy/web-ui-port.json` first, so an already running CLI is reused instead of a second server being spawned
- README front matter now describes the one-click start instead of install-time details

## [1.1.1] - 2026-10-23

### Fixed
- App failed to start: `IS_PACKAGED` was used before its declaration, and `PORT` was never defined
- Port conflict no longer kills the occupying process (previously `taskkill /T /F` on whatever held the port); the app now walks to the next free port instead
- "Stop service" only stops a server this app spawned — a reused external CLI is left running

### Changed
- Default port is now 8317, scanning up to 8317+19; override the start of the range with `CODEBUDDY_DESKTOP_PORT`

## [1.1.0] - 2026-10-22

### Changed
- Renamed project and product from "CodeBuddy Harness" to **codebuddy-desktop**
- Chinese README is now the default; English version available at [README_EN.md](README_EN.md)
- Added disclaimer: this is a client wrapper, not reverse engineering or cracking

## [1.0.0] - 2026-10-22

### Added
- Self-contained Windows desktop client for [CodeBuddy Code](https://www.npmjs.com/package/@tencent-ai/codebuddy-code)
- Bundles the full CodeBuddy CLI (~280MB) — zero external dependencies (no Node.js, no npm, no global install required)
- Tray-resident: closing the window minimizes to system tray; click tray icon to restore
- Background service: CLI runs hidden, survives window close, auto-restarts on crash
- Full access permission mode (`fullAccess`) by default
- Auto-login: reads gateway password from `~/.codebuddy/settings.json`
- Single-instance lock: launching twice focuses the existing window
- Boot auto-start option (from tray menu)
- F12 developer tools for debugging
- Desktop + Start Menu shortcuts
