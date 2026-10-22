# CodeBuddy Desktop

[English](README_EN.md)

[CodeBuddy Code](https://www.npmjs.com/package/@tencent-ai/codebuddy-code)（腾讯 CodeBuddy CLI）的自包含 Windows 桌面客户端。

> **声明**：本项目并非逆向或破解，只是对 CodeBuddy 的一个客户端封装，能够让用户方便地一键启动命令行以及后台运行。所有代码均基于 CodeBuddy 官方公开发布的 npm 包和 Electron 框架，不涉及任何逆向工程或版权规避，因此用户可以放心使用。

客户端内置了完整的 CodeBuddy CLI（约 280MB）——**目标机器零前置依赖**：不需要安装 Node.js、npm，也不需要全局安装 codebuddy。

## 功能

- **一键启动** — 双击快捷方式，CLI 服务自动启动并打开 Web UI
- **托盘常驻** — 关闭窗口最小化到系统托盘，点击托盘图标重新打开
- **后台服务** — CLI 隐藏运行，关窗不停服，崩溃后 2 秒自动重启
- **完全访问** — 默认 `fullAccess` 权限模式
- **单实例** — 重复启动只聚焦已有窗口
- **自动登录** — 读取 `~/.codebuddy/settings.json` 中的网关密码
- **开机自启** — 从托盘菜单一键开启/关闭
- **自包含** — CLI 通过 Electron 内置的 Node 运行时执行（`ELECTRON_RUN_AS_NODE`）

## 下载

从 [Releases](../../releases) 下载最新安装包：

| 文件 | 说明 |
|------|------|
| `codebuddy-desktop-Setup-x.x.x.exe` | NSIS 安装包（推荐）|
| `codebuddy-desktop-x.x.x-Portable.exe` | 便携版单文件 |

## 安装

1. 下载并运行安装包
2. 自动创建桌面快捷方式和开始菜单入口
3. 双击 **CodeBuddy Desktop** 启动

## 托盘菜单

| 操作 | 行为 |
|------|------|
| 打开主窗口 | 显示/聚焦应用窗口 |
| 服务运行中 | 状态指示 |
| 重启服务 | 停止并重新启动 CLI |
| 停止服务 | 停止 CLI |
| 开机自启 | 开启/关闭 Windows 启动项 |
| 打开日志目录 | 打开 `server.log` 所在目录 |
| 退出 | 停止服务（仅限本客户端启动的）并退出 |

## 本地开发

```bash
git clone https://github.com/liujuntao123/codebuddy-desktop.git
cd codebuddy-desktop
npm install        # 安装 electron + electron-builder
npm run prepare    # 下载 CodeBuddy CLI 到 vendor/
npm start          # 开发模式启动
```

### 本地打包

```bash
npm run dist       # 准备 vendor + electron-builder --win
```

产物在 `dist/` 目录。

### 项目结构

```
├── main.js               # Electron 主进程
├── electron-builder.yml  # 打包配置
├── scripts/
│   └── prepare-vendor.js # CI/本地开发自动下载 CLI
├── build/
│   ├── icon.ico          # Windows 应用图标
│   └── icon.png          # 托盘图标
├── vendor/               # （gitignore）CodeBuddy CLI 运行时
│   └── codebuddy-code/
└── .github/workflows/
    └── build.yml         # CI: tag push → build → release
```

### 发布流程

1. 在 `CHANGELOG.md` 中新增 `[x.y.z]` 小节
2. 更新 `package.json` 的 `version`
3. 提交并打 tag：
   ```bash
   git add -A && git commit -m "release: v1.1.0"
   git tag v1.1.0
   git push origin main --tags
   ```
4. GitHub Actions 自动：下载 CLI → 打包 → 从 CHANGELOG.md 提取 Release Notes → 创建 Release 并上传 exe

## 许可证

[MIT](LICENSE) — 内置的 CodeBuddy Code CLI 遵循其自身的[许可协议](https://www.npmjs.com/package/@tencent-ai/codebuddy-code)。
