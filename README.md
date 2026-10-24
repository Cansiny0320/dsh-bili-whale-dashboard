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

**先在同一个 DSH 中安装并启用 [dsh-bili-whale 原版插件](https://github.com/Alterssss/dsh-bili-whale)。** 原版负责 B 站登录和养鱼任务，本插件负责管理界面。两个插件独立安装、独立升级。

本后台提供预构建安装包，**无需克隆仓库、运行 pnpm 或自己构建**。当前包适配 **DSH 0.2.1-rc.2**；完整安装与功能验证使用 DSH Web、原版 v0.4.6。

### 1. 在 DSH 中添加插件

打开 DSH 左侧 **插件 → 添加插件**，将下面的完整地址粘贴到安装框：

```text
https://github.com/Cansiny0320/dsh-bili-whale-dashboard/releases/download/v0.1.0/dsh-bili-whale-dashboard-0.1.0.tgz
```

点击 **安装**，完成后点击 **立即启用**。如果 DSH 提示需要重启，按提示重启当前实例。

也可以在 [GitHub Release](https://github.com/Cansiny0320/dsh-bili-whale-dashboard/releases/latest) 下载 `dsh-bili-whale-dashboard-0.1.0.tgz`，把下载文件的**完整绝对路径**填进同一个安装框。无需解压；不要选择 GitHub 自动生成的 **Source code** 源码压缩包。

<details>
<summary>命令行安装（可选）</summary>

已有 DSH Web 的用户也可执行：

```sh
dsh plugin --profile web add https://github.com/Cansiny0320/dsh-bili-whale-dashboard/releases/download/v0.1.0/dsh-bili-whale-dashboard-0.1.0.tgz
dsh web --port 3081
```

安装和启动需指向原版所在的同一个 profile。Desktop 用户使用应用内的「添加插件」入口。

</details>

### 2. 从 DSH 打开后台

在 DSH 中打开 **设置 → 鲸鱼娘后台 → 打开鲸鱼娘后台**。入口会检查原版插件；未安装或未启用时会提示先处理原版，完成后点击「重新检查」。

后台在同一个 DSH 服务下打开，地址为 `/whale-dashboard/`。例如 DSH 使用 3081 端口时，地址是 [http://127.0.0.1:3081/whale-dashboard/](http://127.0.0.1:3081/whale-dashboard/)。使用 DSH 已认证的同一浏览器访问。

### 3. 首次配置与日常使用

首次使用原版养鱼插件时，先在 **DSH 设置 → 模型 / Models** 配置可用模型，再在 **设置 → 养鱼** 完成 B 站登录、填写分享对象的 UID（mid）和昵称，并运行「依赖体检」。登录方式取决于原版版本：使用它提供的 Cookie 导入或扫码入口。模型与登录都不在本后台配置。

找到 DSH 中原版创建的 `bili-whale` 会话，确认模型和工具执行权限。视频抽帧需要 ffmpeg，具体依赖按原版说明准备。

### 日常怎么用

1. **人设与偏好**：设置称呼、人设正文、话题偏好，分别点击对应的保存按钮。
2. **作息与监听 / 设置**：调整活动窗口、唤醒次数、监听、分享对象、分享方式与通知，修改后保存。
3. **概览 / 日记**：查看运行记录和日记，点击右上角刷新读取最新数据。新账号没有日记或待审回复时，列表为空是正常情况。
4. **待审回复**：核对草稿后拒绝或批准；真实模式下批准会发送 B 站评论。

保持 **DSH 运行**即可，无需另外启动后台服务。关闭后台网页不会停止原版任务；停止 DSH 会停止该宿主中的调度。

### 更新与卸载

在 DSH 插件页卸载旧版后台，再安装新 Release 的 `.tgz` 并启用。**只卸载本后台，不要卸载原版，也不要删除数据目录**。本后台卸载不会删除原版的登录态、配置、日记或审批记录。

### 常见入口问题

| 遇到的问题               | 检查位置                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| 安装提示 DSH 版本不兼容  | 使用当前包支持的 DSH 版本，或选择匹配版本的 Release。                                       |
| 无法下载 GitHub 包       | 先下载 Release 的 `.tgz`，在安装框填写本地绝对路径。更换 npm 镜像不能替代 GitHub 文件下载。 |
| 提示需要原版插件         | 在同一个 DSH 中安装并启用 `dsh-bili-whale`，回到后台入口重新检查。                          |
| 返回 401                 | 先通过 DSH 启动入口认证，再用同一浏览器访问后台。                                           |
| 返回 404                 | 确认后台已启用，并按 DSH 提示重启；安装与访问必须是同一个 DSH 实例。                        |
| 显示「演示数据」         | 当前打开的是源码开发演示（默认 4179 端口）；使用 DSH 内的「打开鲸鱼娘后台」。               |
| 后台可打开，但鱼没有运行 | 检查原版的依赖体检、调度状态，以及 `bili-whale` 会话的模型与权限。                          |

详细的数据目录与恢复说明见 [使用说明](docs/usage.md)。源码构建、独立演示和发布打包见 [开发文档](docs/development.md)。

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
pnpm release:pack
pnpm test:package
```

浏览器检查使用无头 Microsoft Edge；真实宿主检查使用 `pnpm test:dsh`，需先完成隔离 DSH 安装。测试不调用模型、不发送真实 B 站消息，也不操作桌面鼠标键盘。

当前已通过 23 项单元/集成测试和 6 项浏览器场景。浏览器检查覆盖六页在 1600、1280、390 像素宽度下的可读性与溢出，以及保存、日记切换、审批确认和防重复处理；真实账号发送尚未验证。

[使用与故障处理](docs/usage.md) · [源码开发与打包](docs/development.md) · [验证范围](docs/verification.md) · [素材与第三方代码](THIRD-PARTY-NOTICES.md)

## 赞助

如果这个项目对你有帮助，欢迎通过微信或支付宝支持后续开发。感谢你的支持！

![微信与支付宝赞助二维码](.github/sponsorship/sponsorship-cats.png)

## 许可证与致谢

本项目使用 [MIT License](LICENSE)，基于 [Alterssss/dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale) 的数据和接口构建，保留相关代码许可。公开仓库不附带授权未确认的鲸鱼娘图片；可按 [本地头像说明](apps/dashboard/public/brand/README.md) 添加有权使用的素材。本项目不是 DeepSeek 或 Bilibili 官方项目。

相关项目：[codex-bili-dragon](https://github.com/Cansiny0320/codex-bili-dragon) · 基于官方 Codex 客户端的 B 站助手；[bili-agent-kit](https://github.com/Cansiny0320/bili-agent-kit) · 宿主无关的 B 站 SDK、CLI 与 MCP 工具。
