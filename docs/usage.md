# 使用说明

[返回项目首页](../README.md)

首次安装请先按首页的 [安装与接入步骤](../README.md#快速开始) 操作；那里包含两个插件的安装、DSH 首次配置、后台入口和 [日常使用流程](../README.md#日常怎么用)。本文补充数据路径、保存语义及排障细节。

独立的本机管理界面，适配原版 [dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale) v0.4.6（`3e11454a5961300aa7094df0f08e630bd39999dd`）。管理原版数据和设置，不包含或启动第二个养鱼调度器。

六个页面：概览、公开/私密日记、待审评论回复、人设与偏好、作息与监听、设置。设置包含分享与通知、请求保护、账号环境、会话轮换。

## 本机运行

克隆仓库后进入项目目录：

```sh
git clone https://github.com/Cansiny0320/dsh-bili-whale-dashboard.git
cd dsh-bili-whale-dashboard
```

需要 Node 24.11+ 的 24 LTS 或 Node 26+。Windows 脚本使用项目内 pnpm 12.15.0，不修改系统 Node 或 pnpm。可用 `DASHBOARD_NODE` 指定兼容的 `node.exe`。

首次安装：

```powershell
& .\scripts\bootstrap.ps1
& .\scripts\pnpm.ps1 build
& .\scripts\pnpm.ps1 preview
```

依赖已经安装时只需运行后两条命令。生产构建演示地址：<http://127.0.0.1:4179/whale-dashboard/>。

开发模式：

```powershell
& .\scripts\pnpm.ps1 dev
```

开发地址：<http://127.0.0.1:4178/whale-dashboard/>。核心包改动后需要重启开发服务。

演示数据只位于本项目 `.local/demo/`，不会读取用户真实 `.dsh`、`.bili-ai` 或凭据，也不会向 B 站、Webhook 或通知渠道发送消息。演示审批只更新演示队列。首次运行创建样例，之后保留保存结果。端口通过 `PORT` 修改；`DASHBOARD_DEMO_DIR` 可指定另一处绝对路径作为隔离数据目录。

## DSH 同源插件

已在官方 `@deepseek-ai/dsh@0.2.1-rc.2` Web 宿主完成联调：认证后的六页、同源 API、配置和人设保存均通过。**未验证真实 B 站账号发送**。

使用 DSH 的本地插件安装方式，将原版插件与本项目作为 `link:` 插件加入 Web profile。插件入口为 `packages/dsh-plugin/dist/index.js`；运行目录需保留 workspace 依赖与 `apps/dashboard/dist/`。

对已有 DSH，完成本项目构建后执行（路径替换为各自的绝对路径）：

```sh
dsh plugin --profile web add link:/path/to/dsh-bili-whale link:/path/to/dsh-bili-whale-dashboard
dsh web --port 3081
```

使用自定义 Web profile 时，将安装命令的 `--profile web` 替换为实际名称，并用 `dsh --profile <名称> --port 3081` 启动。安装与启动必须指向同一 profile；不要把插件只装到 `desktop` 后启动 `web`。

先通过 DSH 打开的启动入口建立浏览器会话，再在同一浏览器打开 `http://127.0.0.1:3081/whale-dashboard/`。直接访问而未登录会返回 401。

没有现有 DSH 时，先按上面的 Windows 安装步骤准备项目内 pnpm，再使用项目专用的隔离安装。在兼容的 Node 环境中执行：

```sh
npm install --prefix .tools/dsh --no-audit --no-fund @deepseek-ai/dsh@0.2.1-rc.2
node scripts/dsh-runtime.mjs web --dump-default-config
node scripts/dsh-runtime.mjs plugin --profile web add link:/path/to/dsh-bili-whale link:/path/to/dsh-bili-whale-dashboard
node scripts/dsh-runtime.mjs web --port 3081
```

Windows 同样使用 `link:D:/path/to/...`。启动脚本仅为子进程设置本项目 `.local/dsh-user/` 下的专用用户、DSH 和 agent 目录，不读入系统用户的 B 站登录态，也不继承常见模型密钥；不会改变系统环境变量。启动后按需在这个独立 DSH 中配置账号。

安装后挂载 `/whale-dashboard/`，与原版 `/dsh-bili/api/` 同源。所有页面、资源、RPC 都经过 `connection.requestRejection`；认证服务缺失或拒绝时关闭访问，不提供绕过入口。其他 DSH 版本的兼容性需单独验证。

仅转发以下原版接口：

| 接口                   | 用途                               |
| ---------------------- | ---------------------------------- |
| `settings` GET/POST    | 读取与保存配置，保留原版热更新行为 |
| `persona` GET/POST     | 独立人设正文                       |
| `pending` GET          | 原版待审评论                       |
| `pending/approve` POST | 明确批准后的发送                   |
| `pending/reject` POST  | 拒绝草稿                           |

不会调用登录、Cookie 导入、依赖体检或测试通知接口。服务端转发固定路径并继承必要认证头；不接收任意目标 URL。卸载仅注销本插件路由，不停止原版调度器。

数据路径与原版一致：`USERPROFILE` / `HOME` 下的 `.bili-ai`；`DSH_HOME` 或默认用户目录下的 `.dsh`；`BILI_WHALE_CONFIG` 可覆盖配置文件位置。浏览器不能提交文件路径。日记及结构化状态只读，单文件读取上限 4 MiB，拒绝符号链接目录或文件。

## 保存和审批语义

- 配置和人设正文各自带版本检查，外部修改后拒绝覆盖。原版没有跨进程事务，因此版本核对与原版实际写入之间仍存在其自身的竞争窗口。
- 遇到原版隐式监听默认值分歧时，必须核对并明确确认当前值；旧 `whale-night.config.json` 存在覆盖时，阻止作息保存，不自动迁移或删除原文件。
- 评论审批先写本地操作记录，再请求原版。确认成功才显示已发送；超时、断开或原版无法确认发送结果时记为 `unknown`，不自动重试。原版恢复草稿并更换 ID 后，同一目标和正文仍被拦截。
- 操作记录位于 `DSH_HOME/whale-dashboard/operations.json`；同目录 `mutation.lock` 防止本插件并发保存/审批。进程异常留下锁或未知记录时，先核对原版/B 站实际结果，再由人工处理。不要为了重试直接删除记录。原版自己的请求保护操作账本独立存在。
- 运行状态展示“未确认”；文件存在和计划时间不被当作调度器心跳。请求次数为本机所有账号合计，不读取凭据来识别账号。
- 分享额度采用本地日历日期，并按原版沉默规则衰减。评论 AI 浓度检查阈值为 30%，没有新增虚构的总开关或手动唤醒操作。

## 工程与验证

`apps/dashboard`：React 19、TanStack Start/Router SSR、Tailwind 4、shadcn/ui base-nova、Lucide。`packages/core`：TypeScript、Zod、oRPC、文件与原版 API 适配。`packages/dsh-plugin`：DSH 生命周期与认证、静态资源和 SSR 承载。Vite+ 负责构建、Oxlint/Oxfmt 与单元测试。

```powershell
& .\scripts\pnpm.ps1 check
& .\scripts\pnpm.ps1 test
& .\scripts\pnpm.ps1 build
& .\scripts\pnpm.ps1 test:e2e
```

`check` 的类型步骤会产生核心包声明与编译产物；lint 和格式检查不会自动修复。`format` 才会改写格式。`build` 只写本项目构建目录。E2E 使用无头 Microsoft Edge、隔离演示目录，不发送系统鼠标键盘输入；需要本机已安装 Edge。截图位于 `outputs/`。

`test:dsh` 从上述安装读取原版插件路径，并在 `.local/dsh-tests/` 的全新目录建立 profile 和联调样例。测试启动真实 DSH，使用无头 Edge，不调用模型或向 B 站发送消息。

实际验证结果见 [验证记录](verification.md)。源码采用 MIT；素材来源见 [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md)。公开仓库不附带授权未确认的鲸鱼娘图片，缺省显示品牌文字；拥有使用权限的用户可按 [本地头像说明](../apps/dashboard/public/brand/README.md) 添加。

## 相关项目

- [codex-bili-dragon](https://github.com/Cansiny0320/codex-bili-dragon)：运行在官方 Codex 客户端上的 B 站助手。
- [bili-agent-kit](https://github.com/Cansiny0320/bili-agent-kit)：不依赖特定宿主的 B 站 SDK、CLI 与 MCP 工具。
- [dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale)：本后台所管理的原版 DSH 养鱼插件。
