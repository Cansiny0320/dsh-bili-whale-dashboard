# 开发与发布

[返回 README](../README.md)

普通用户从 [GitHub Release](https://github.com/Cansiny0320/dsh-bili-whale-dashboard/releases/latest) 安装预构建 `.tgz` 即可。本文仅用于修改源码、运行演示或制作新发行包。

## 源码运行

需要 Git、Node.js 24.11+ 的 24.x 或 26+、pnpm 12.15.0。

```sh
git clone https://github.com/Cansiny0320/dsh-bili-whale-dashboard.git
cd dsh-bili-whale-dashboard
pnpm install --frozen-lockfile
pnpm build
pnpm preview
```

Windows 可用项目脚本安装 pnpm 与依赖：

```powershell
& .\scripts\bootstrap.ps1
& .\scripts\pnpm.ps1 build
& .\scripts\pnpm.ps1 preview
```

独立演示位于 <http://127.0.0.1:4179/whale-dashboard/>，数据在 `.local/demo/`。它不使用真实账号，也不会发送 B 站消息。`pnpm dev` 启动开发服务，默认 4178 端口。

## 本地 DSH 联调

原版和后台必须在同一 Web profile 中。构建后用 `dsh plugin --profile web add link:/absolute/path/to/dsh-bili-whale link:/absolute/path/to/dsh-bili-whale-dashboard` 安装，再启动 `dsh web`。

项目隔离 DSH 的安装方法和数据目录见 [使用说明](usage.md#dsh-同源插件)。开发用 `link:` 依赖源码目录，不能作为普通用户的发行方式。

## 检查

```sh
pnpm check
pnpm test
pnpm test:e2e
pnpm release:pack
pnpm test:package
```

`check` 包含类型、lint 和格式检查；类型步骤会生成编译产物。`test:e2e` 使用无头 Edge 和隔离演示目录。`release:pack` 会重新构建、写入 `.local/release-builds/` 和 `outputs/releases/`；`test:package` 在系统临时目录解包，启动临时 HTTP 服务验证六页和资源，不依赖源码目录的依赖树。打包检查需要系统提供 `tar`。

先按使用说明安装项目隔离 DSH 与原版后，可以经真实 DSH 的图形安装界面验证包：

```powershell
& .\scripts\pnpm.ps1 release:pack
& .\scripts\pnpm.ps1 test:package
$env:DASHBOARD_PACKAGE_SPEC = (Resolve-Path outputs/releases/dsh-bili-whale-dashboard-0.1.0.tgz).Path
& .\scripts\pnpm.ps1 test:dsh
```

`DASHBOARD_PACKAGE_SPEC` 也可设为 GitHub Release 资产的完整 URL；留空时运行源码 link 联调。每次测试创建全新 home，默认使用 3082 端口，可通过 `DSH_TEST_PORT` 修改。测试无账号凭据，作息唤醒、分享与监听均关闭，不调用模型、不向 B 站发消息；缺少原版提示使用浏览器内的 404 响应模拟。全程无头运行，不操作桌面鼠标键盘。

## 发布包内容

- 宿主入口与核心逻辑、SSR 及其运行依赖打包为 JavaScript；浏览器资源来自正式构建。
- 最小 `package.json` 声明 DSH bundle 和客户端入口，不含依赖安装或构建脚本。DSH 可直接从 `.tgz` 启用。
- 发布构建强制排除本地头像，不复制 `.local`、`.tools`、源码、测试或任何凭据。
- 保留项目、原版参考代码、shadcn/ui 许可，并收集 Vite 和服务端 bundle 涉及的第三方许可。
- 输出 `dsh-bili-whale-dashboard-<version>.tgz` 与 `SHA256SUMS`。当前只声明通过验收的 DSH 版本。

发布前运行全部相关检查和本地包安装；将版本对应的源码提交、tag 与 Release 对齐，上传 `.tgz` 和 `SHA256SUMS`。发布后从实际资产 URL 再验证下载校验与 DSH 安装。不要上传开发机器的 `node_modules`、用户目录、含角色素材的截图，也不要用 GitHub 自动生成的源码归档替代安装包。

DSH 升级兼容性需用目标版本重新验证后再扩展 manifest 范围。回滚时重新安装已验证版本的后台包，保留原版和数据目录。
