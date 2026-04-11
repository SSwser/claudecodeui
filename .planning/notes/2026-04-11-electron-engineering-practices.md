---
date: '2026-04-11 15:34'
promoted: false
---

Electron 实践总结详细记录下来

来源：Orca 项目工程实践研究

## 工具链

- 开发构建：electron-vite
- 安装包打包：electron-builder（config/electron-builder.config.cjs）
- 自动更新：dev-app-update.yml，provider: github，指向 GitHub Releases

## 配置隔离

所有构建配置集中在 `config/` 目录，不散落在根目录：
config/electron-builder.config.cjs
config/tsconfig.main.json
config/tsconfig.preload.json
config/vitest.config.ts

## macOS 发布门控（重点可借鉴）

用 env var 区分本地构建与 CI 发布构建，共享同一份配置：

const isMacRelease = process.env.ORCA_MAC_RELEASE === '1'
mac: {
hardenedRuntime: isMacRelease,
notarize: isMacRelease,
forceCodeSigning: isMacRelease,
}

原因注释原文："local macOS validation builds should launch without Apple release credentials"
→ 本地开发者无需 Apple 证书也能打包验证，CI 正式打包时设 ORCA_MAC_RELEASE=1

## 原生模块处理

npmRebuild: true // 跨架构重新编译 node-pty 等原生模块
asarUnpack: ['out/cli/**', 'out/shared/**']
// "CLI entry-point imports shared modules — both must be unpacked so Node's require() can resolve cross-directory imports"

## 版本发布流程（极简三步）

npm version patch // 或 minor / major，自动 bump package.json + git tag
git push --follow-tags
// tag 推送后 release.yml 自动触发 3 平台并行构建 → draft release → 手动 publish

package.json scripts：
"release:rc": "npm version prerelease --preid rc && git push --follow-tags"
"release:patch": "npm version patch && git push --follow-tags"
"release:minor": "npm version minor && git push --follow-tags"
"release:major": "npm version major && git push --follow-tags"

## CI/CD（pr.yml）

PR CI 只跑 ubuntu-latest 单机，四步：

1. oxlint --format github（输出 GitHub annotations）
2. tsc --noEmit（类型检查）
3. vitest run（测试）
4. electron-vite build（构建验证）

release.yml：tag 触发 → 3 平台矩阵（macos-latest/windows-latest/ubuntu-latest）→ 并行构建 → 上传 artifacts → 发布 draft release

## 平台打包目标

macOS: dmg + zip，x64 + arm64 universal
Windows: nsis（installer）
Linux: AppImage + deb

## CI 签名密钥配置（GitHub Secrets）

Mac: CSC_LINK + CSC_KEY_PASSWORD（Developer ID 证书）
APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID（公证）
Windows: 类似 CSC_LINK 方式

## 对 claudecodeui 的借鉴建议

当前是 Web 应用（Express + React），不需要 Electron 打包。
若未来要桌面化，最值得复制的实践：

1. isMacRelease 环境变量门控——让本地开发与 CI 发布共用一份配置
2. config/ 目录隔离——构建配置不污染项目根目录
3. npm version + push --follow-tags——零额外工具链的版本发布流程
