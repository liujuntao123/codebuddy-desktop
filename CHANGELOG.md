# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
