# 来源与素材

## 原版功能基线

Alterssss/dsh-bili-whale v0.4.6，commit 3e11454a5961300aa7094df0f08e630bd39999dd，MIT。本项目通过其接口管理原版，不包含调度器副本。

原版默认值、额度和状态解释以该版本为基线。保留 MIT 许可全文于 `licenses/dsh-bili-whale-MIT.txt`。

## 鲸鱼娘形象

用户要求采用已有成熟社区形象，不使用本轮最初自拟的浅发角色。

- 文件：apps/dashboard/public/brand/whalechan.webp
- 来源：https://github.com/Neko3000/deepseek-whalechan/blob/main/skills/whalechan-image-character/assets/reference-images/semi-chibi/neutral_standing_front_isolated.webp
- SHA-256：e27638afe71cbc7edfa770b2f21201b627c7fb10f92d532a91f5e99563d24824
- 形象参考库列出的创作者：ZipZipPipe（https://space.bilibili.com/4168597）与上善无形（https://space.bilibili.com/4456176）。该库没有逐图原作者映射，不在此断言这张图片由其中某人独自创作。
- 图片按原样用于本机私人项目；文件与包含它的本地截图均已从公开仓库排除。图片不自动适用参考库代码的 MIT 许可，不宣称取得再分发或商业授权。来源说明：https://github.com/Neko3000/deepseek-whalechan/blob/main/THIRD-PARTY-NOTICES.md
- Deepseek 字标用于标识所管理的工具，本项目不是官方产品。

## UI 组件

Button、Input、Textarea、Switch 基于 shadcn/ui 官方 base-nova registry（MIT）并按本项目字号与无障碍需求调整。https://github.com/shadcn-ui/ui

许可全文：`licenses/shadcn-ui-MIT.txt`。

## 预构建插件包

GitHub Release 的 `.tgz` 不包含鲸鱼娘图片。包内保留上述许可证，并在 `licenses/DEPENDENCIES.json` 记录服务端 bundle 涉及的依赖及其许可证文件；`licenses/dashboard-client.md`、`licenses/dashboard-server.md` 由前端构建工具收集。原版养鱼插件不包含在发行包中，需由用户独立安装。
