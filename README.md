<h1 align="center">DSH Bili Whale Dashboard</h1>
<p align="center">DeepSeek 鲸鱼娘后台 · 查看日记、审核回复、调整人设与作息。</p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6" alt="Strict TypeScript">
  <img src="https://img.shields.io/badge/DSH-Web-536dfe" alt="DSH Web plugin">
</p>
<p align="center"><a href="#快速开始">安装与接入</a> · <a href="#日常怎么用">日常使用</a> · <a href="docs/usage.md">详细说明</a> · <a href="https://github.com/Cansiny0320/dsh-bili-whale-dashboard/issues">问题反馈</a></p>
<p align="center"><a href="README.md">简体中文</a> · <a href="README.en.md">English</a></p>

DSH Bili Whale Dashboard 是原版 [dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale) 的本机管理后台。在同一个 DSH 中查看两份日记、处理待审评论回复，并调整人设、兴趣和活动时间；养鱼任务继续由原版插件执行。

![管理页实机截图，内容为隔离演示数据](docs/images/dashboard.png)

<details>
<summary>查看更多界面：日记、待审回复、人设与偏好</summary>

**日记**：左侧搜索和切换公开、私密日记，右侧阅读正文；文件详情中可查看原文。

![日记阅读界面](docs/images/diaries.png)

**待审回复**：并排查看原评论、回复草稿、来源与操作，批准前再次确认。

![待审回复界面](docs/images/reviews.png)

**人设与偏好**：分别保存称呼、人设正文和话题偏好，常用别名按需展开。

![人设与偏好界面](docs/images/persona.png)

</details>

## 能帮你做什么？

| 页面       | 用途                                                                               |
| ---------- | ---------------------------------------------------------------------------------- |
| 概览       | 查看计划唤醒时间、已配置机会、分享进度、待审数量和最近事件，阅读最新公开日记摘要。 |
| 日记       | 分别搜索公开与私密日记，查看日期、标题、正文和原始文本。                           |
| 待审回复   | 核对原评论和拟发内容，确认后批准或拒绝；发送结果不明时保留记录，阻止重复发送。     |
| 人设与偏好 | 编辑角色称呼、人设正文、话题偏好与别名，分别保存到原版使用的数据中。               |
| 作息与监听 | 配置活动窗口、唤醒次数、休息概率及评论、私信、直播监听。                           |
| 设置       | 管理分享与通知、请求保护和会话轮换，查看账号环境。                                 |

支持桌面与手机布局。窄屏下内容自动换行或分栏重排，正文和输入框保持可读字号。以上截图均为隔离演示数据；公开版本默认显示文字品牌，本地可添加鲸鱼娘头像。

## 快速开始

需要一起运行三个部分：

| 部分                                                                   | 负责什么                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------- |
| DSH Web                                                                | 提供模型、会话和网页服务。                              |
| [dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale) 原版插件 | 管理 B 站登录，执行作息调度、看视频、写日记和发送消息。 |
| 本后台                                                                 | 读取同一份日记与状态，通过原版接口保存设置和审核回复。  |

**两个插件必须装在同一个 DSH Web profile 中。** 后台随 `dsh web` 一起启动，无需另开网页服务。已联调版本为 **DSH 0.2.1-rc.2 + 原版 v0.4.6**。

### 1. 下载两个项目并构建后台

先安装 Git 和 **Node.js 24.11+（24.x）或 26+**。以下以 Windows PowerShell 为例，在你准备存放项目的目录执行；两个仓库放在同一级：

```powershell
git clone https://github.com/Alterssss/dsh-bili-whale.git
git clone https://github.com/Cansiny0320/dsh-bili-whale-dashboard.git
cd dsh-bili-whale-dashboard

# 安装项目内 pnpm 和依赖，再构建后台
& .\scripts\bootstrap.ps1
& .\scripts\pnpm.ps1 build

# 后续安装命令使用这两个绝对路径
$whalePlugin = (Resolve-Path ..\dsh-bili-whale).Path.Replace('\', '/')
$whaleDashboard = (Get-Location).Path.Replace('\', '/')
```

已有原版仓库时不必重复克隆，将 `$whalePlugin` 指向它。macOS / Linux 或已有 pnpm 的环境可用 `pnpm install --frozen-lockfile` 和 `pnpm build` 构建，再按下方已有 DSH 的命令安装，使用自己的绝对路径。

### 2. 把两个插件装进 DSH 并启动

**已有 DSH Web 的用户**，在上一步的 PowerShell 中执行：

```powershell
dsh plugin --profile web add "link:$whalePlugin" "link:$whaleDashboard"
dsh web --port 3081
```

如果 DSH 已在运行，安装后先停止旧进程，再启动。此方式使用现有 DSH 的账号和数据；使用自定义 Web profile 时，安装和启动都要指向同一 profile，详见 [接入说明](docs/usage.md#dsh-同源插件)。

**还没有 DSH 的用户**，改为在同一 PowerShell 中执行以下完整流程，创建项目专用环境：

```powershell
& .\scripts\pnpm.ps1 exec npm install --prefix .tools/dsh --no-audit --no-fund @deepseek-ai/dsh@0.2.1-rc.2
& .\scripts\pnpm.ps1 dsh web --dump-default-config
& .\scripts\pnpm.ps1 dsh plugin --profile web add "link:$whalePlugin" "link:$whaleDashboard"
& .\scripts\pnpm.ps1 dsh web --port 3081
```

项目专用环境的数据保存在 `.local/dsh-user/`，需要重新配置模型与 B 站登录，不会自动使用你其他 DSH 的账号和数据。上面两种方式选择一种即可。

### 3. 在 DSH 中完成首次配置

启动后，DSH 会自动打开带认证信息的浏览器入口。先完成这个入口的认证，然后在 **DSH 主界面**配置：

1. **设置 → 模型 / Models**：配置要使用的模型提供方和凭据。
2. **设置 → 养鱼**：完成 B 站登录。原版 v0.4.6 使用 Cookie 导入，按页面填写 `SESSDATA`、`bili_jct` 等字段；如果安装的插件带有扫码入口，则可使用扫码。登录入口属于原版插件，不在本后台。
3. 在同一个「养鱼」设置页填写分享对象的 **B 站 UID（mid）和昵称**，保存后运行「依赖体检」。视频抽帧需要 ffmpeg；缺少它会影响看画面的能力。
4. 在工作区找到原版创建的 **`bili-whale` 会话**（通常在「未分组」），选择可用模型，并按原版说明配置运行工具及写入工作目录所需的权限。

### 4. 打开真实后台

在**刚才完成认证的同一浏览器**打开：

**[http://127.0.0.1:3081/whale-dashboard/](http://127.0.0.1:3081/whale-dashboard/)**

这个地址管理该 DSH 中原版插件的真实数据。后台能够正常打开时，左侧会显示六个页面；新账号没有日记或待审回复时，列表为空是正常情况。使用不同端口时替换地址中的 `3081`。

### 日常怎么用

1. 在 **人设与偏好**中设置称呼、正文和话题，分别点击对应的保存按钮。
2. 在 **作息与监听**中调整活动窗口、唤醒次数及需要的监听；在 **设置**中调整分享对象、分享方式与通知，修改后保存。
3. 保持 **DSH 进程运行**。原版插件按作息执行任务；关闭后台网页不会停止它，停止 DSH 则会停止本次宿主中的调度。
4. 在 **概览 / 日记**查看结果，使用页面右上角刷新读取最新记录。在 **待审回复**核对草稿，再拒绝或批准；真实模式下批准会发送 B 站评论。

下次使用，只需在项目目录再次执行所选方式的启动命令：已有 DSH 用 `dsh web --port 3081`，项目专用环境用 `& .\scripts\pnpm.ps1 dsh web --port 3081`。修改后台代码后需重新构建并重启 DSH。

### 只想先看界面？

完成第 1 步后运行 `& .\scripts\pnpm.ps1 preview`，打开 **[独立演示](http://127.0.0.1:4179/whale-dashboard/)**。它使用 `.local/demo/` 中的样例，不需要 DSH 或 B 站账号，保存和审批只影响演示数据。页面会显示「演示数据」。

### 常见入口问题

| 遇到的问题               | 检查位置                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 页面一直显示「演示数据」 | 当前打开的是 `4179` 的演示；真实后台是 DSH 端口下的 `/whale-dashboard/`。                                              |
| 返回 401                 | 先通过 DSH 自动打开的启动入口认证，再在同一浏览器打开后台。                                                            |
| 返回 404                 | 确认后台已构建、两个插件装入同一个 Web profile，且安装后已重启 DSH。                                                   |
| 看不到已有日记或登录态   | 检查是否误用了新建的项目专用环境；它与原有 DSH 的数据目录不同。                                                        |
| 后台可打开，但鱼没有运行 | 去 DSH 的「设置 → 养鱼」检查依赖和调度状态，再检查 `bili-whale` 会话的模型与权限；后台文件记录不能证明调度器正在运行。 |

更多安装方式、数据目录和恢复说明见 [使用说明](docs/usage.md)。

## 数据与权限

接入 DSH 后，后台使用原版 `.dsh`、`.bili-ai` 数据目录，并通过原版接口保存配置、人设和处理审批。后台不读取账号 Cookie；B 站登录与模型配置在原版插件和 DSH 中完成。

「批准并发送」会请求原版执行真实 B 站操作。发送结果未知时不会自动重试；配置被其他程序修改时会提示冲突。运行状态显示“未确认”时，不能据此判断调度器正在运行。详细边界与恢复方法见 [使用说明](docs/usage.md#保存和审批语义)。

## 开发与文档

源码使用严格 TypeScript、pnpm workspace 和 Vite+。界面使用 React 19、TanStack Start / Router、Tailwind CSS v4、shadcn/ui（base-nova）、Lucide 与 oRPC。

```sh
pnpm check
pnpm test
pnpm build
pnpm test:e2e
```

浏览器检查使用无头 Microsoft Edge；真实宿主检查使用 `pnpm test:dsh`，需先完成隔离 DSH 安装。测试不调用模型、不发送真实 B 站消息，也不操作桌面鼠标键盘。

当前已通过 23 项单元/集成测试和 6 项浏览器场景。浏览器检查覆盖六页在 1600、1280、390 像素宽度下的可读性与溢出，以及保存、日记切换、审批确认和防重复处理；真实账号发送尚未验证。

[使用与故障处理](docs/usage.md) · [验证范围](docs/verification.md) · [素材与第三方代码](THIRD-PARTY-NOTICES.md)

## 赞助

如果这个项目对你有帮助，欢迎通过微信或支付宝支持后续开发。感谢你的支持！

![微信与支付宝赞助二维码](.github/sponsorship/sponsorship-cats.png)

## 许可证与致谢

本项目使用 [MIT License](LICENSE)，基于 [Alterssss/dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale) 的数据和接口构建，保留相关代码许可。公开仓库不附带授权未确认的鲸鱼娘图片；可按 [本地头像说明](apps/dashboard/public/brand/README.md) 添加有权使用的素材。本项目不是 DeepSeek 或 Bilibili 官方项目。

相关项目：[codex-bili-dragon](https://github.com/Cansiny0320/codex-bili-dragon) · 基于官方 Codex 客户端的 B 站助手；[bili-agent-kit](https://github.com/Cansiny0320/bili-agent-kit) · 宿主无关的 B 站 SDK、CLI 与 MCP 工具。
