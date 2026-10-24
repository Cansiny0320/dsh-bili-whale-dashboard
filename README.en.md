<h1 align="center">DSH Bili Whale Dashboard</h1>
<p align="center">A local dashboard for diaries, reply reviews, personality and schedules.</p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6" alt="Strict TypeScript">
  <img src="https://img.shields.io/badge/DSH-Web-536dfe" alt="DSH Web plugin">
</p>
<p align="center"><a href="docs/usage.md">Usage guide</a> · <a href="https://github.com/Cansiny0320/dsh-bili-whale-dashboard/issues">Issues</a></p>
<p align="center"><a href="README.md">简体中文</a> · <a href="README.en.md">English</a></p>

DSH Bili Whale Dashboard is a local management interface for [dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale). Read both diaries, review pending comment replies and adjust personality, interests and activity times inside the same DSH instance. The original plugin continues to run the agent's tasks.

![Actual dashboard screenshot with isolated demo data](docs/images/dashboard.png)

<details>
<summary>More screenshots: diaries, reply reviews, personality and preferences</summary>

**Diaries**: search and switch between public and private entries on the left, then read on the right. Open file details to view the raw text.

![Diary reader](docs/images/diaries.png)

**Reply reviews**: compare the original comment, draft reply, source and actions side by side, with confirmation before approval.

![Pending reply reviews](docs/images/reviews.png)

**Personality and preferences**: save names, personality text and topic preferences separately; expand aliases when needed.

![Personality and preferences](docs/images/persona.png)

</details>

## What can it do?

| Page                        | Features                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Overview                    | View planned wake times, configured opportunities, sharing progress, pending replies, recent events and a public diary excerpt.  |
| Diaries                     | Search public and private entries separately; read dates, titles, rendered content and raw text.                                 |
| Reply reviews               | Compare original comments and drafts before approving or rejecting. Uncertain results remain recorded and block duplicate sends. |
| Personality and preferences | Edit and separately save names, personality text, topic preferences and aliases in the original plugin's data.                   |
| Schedules and listeners     | Configure activity windows, wake counts, rest probability and comment, DM and live listeners.                                    |
| Settings                    | Manage sharing, notifications, request protection and session rotation; inspect account environment information.                 |

Desktop and mobile layouts are supported. Content wraps or rearranges on narrow screens while body text and inputs remain readable. All screenshots use isolated demo data. The public version displays a text brand by default; a whale-character portrait can be added locally.

## Getting started

Requires **Node.js 24.11+ within 24.x or 26+** and **pnpm 12.15.0**. Start the standalone demo to explore the interface and save flow:

```sh
git clone https://github.com/Cansiny0320/dsh-bili-whale-dashboard.git
cd dsh-bili-whale-dashboard
pnpm install --frozen-lockfile
pnpm build
pnpm preview
```

Open <http://127.0.0.1:4179/whale-dashboard/>. Demo data stays in `.local/demo/`; all actions affect only this data and do not connect to a real Bilibili account. Windows users can also use the bundled pnpm scripts described in [installation and startup](docs/usage.md#本机运行). The interface and detailed usage guide currently use Chinese.

To manage real data, install both the original plugin and this dashboard in DSH using the [integration guide](docs/usage.md#dsh-同源插件). Integration was verified with **DSH 0.2.1-rc.2 Web + original plugin v0.4.6**. The dashboard is served at `/whale-dashboard/`; authenticate through the DSH launch URL first.

## Data and permissions

When connected to DSH, the dashboard uses the original `.dsh` and `.bili-ai` directories and calls the original APIs to save settings, update personality text and process reviews. It does not read account cookies. Bilibili login and model configuration remain in the original plugin and DSH.

Approving a reply asks the original plugin to perform a real Bilibili action. Unknown send results are not retried automatically; externally modified settings produce a conflict. An unconfirmed runtime status does not establish that the scheduler is running. See [saving and recovery](docs/usage.md#保存和审批语义) for details.

## Development and documentation

The project uses strict TypeScript, a pnpm workspace and Vite+. The interface uses React 19, TanStack Start / Router, Tailwind CSS v4, shadcn/ui (base-nova), Lucide and oRPC.

```sh
pnpm check
pnpm test
pnpm build
pnpm test:e2e
```

Browser checks use headless Microsoft Edge. Run `pnpm test:dsh` after setting up the isolated DSH installation to test the real host. Tests do not invoke models, send real Bilibili messages or control desktop input.

Currently, 23 unit/integration tests and 6 browser scenarios pass. Browser checks cover readability and overflow across all six pages at widths of 1600, 1280 and 390 pixels, plus saving, diary switching, approval confirmation and duplicate prevention. Sending from a real account has not been verified.

[Usage and troubleshooting](docs/usage.md) · [Verification](docs/verification.md) · [Assets and third-party code](THIRD-PARTY-NOTICES.md)

## Sponsorship

If this project is useful to you, you can support its development through WeChat Pay or Alipay. Thank you!

![WeChat Pay and Alipay sponsorship codes](.github/sponsorship/sponsorship-cats.png)

## License and acknowledgements

Released under the [MIT License](LICENSE). Built around the data and APIs of [Alterssss/dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale), retaining the relevant code licenses. The public repository excludes whale-character artwork whose redistribution permission has not been confirmed. Follow the [local portrait guide](apps/dashboard/public/brand/README.md) to add artwork you have permission to use. This is not an official DeepSeek or Bilibili project.

Related projects: [codex-bili-dragon](https://github.com/Cansiny0320/codex-bili-dragon), a Bilibili companion using the official Codex client; and [bili-agent-kit](https://github.com/Cansiny0320/bili-agent-kit), a host-independent Bilibili SDK, CLI and MCP toolkit.
