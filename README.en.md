<h1 align="center">DSH Bili Whale Dashboard</h1>
<p align="center">A local dashboard for diaries, reply reviews, personality and schedules.</p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6" alt="Strict TypeScript">
  <img src="https://img.shields.io/badge/DSH-Web-536dfe" alt="DSH Web plugin">
</p>
<p align="center"><a href="#getting-started">Installation</a> · <a href="#daily-use">Daily use</a> · <a href="docs/usage.md">Detailed guide</a> · <a href="https://github.com/Cansiny0320/dsh-bili-whale-dashboard/issues">Issues</a></p>
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

**Install and enable the original [dsh-bili-whale plugin](https://github.com/Alterssss/dsh-bili-whale) in the same DSH instance first.** It handles Bilibili login and agent tasks; this plugin provides the management interface. The two plugins are installed and upgraded independently.

The dashboard ships as a prebuilt package: **no repository clone, pnpm commands or manual build required**. The current package targets **DSH 0.2.1-rc.2**. End-to-end installation and functionality are verified with DSH Web and original plugin v0.4.6.

### 1. Add the plugin in DSH

Open **Plugins → Add plugin** in DSH and paste this complete URL:

```text
https://github.com/Cansiny0320/dsh-bili-whale-dashboard/releases/download/v0.1.0/dsh-bili-whale-dashboard-0.1.0.tgz
```

Click **Install**, then **Enable now**. If DSH requests a restart, restart that instance.

Alternatively, download `dsh-bili-whale-dashboard-0.1.0.tgz` from the [GitHub Release](https://github.com/Cansiny0320/dsh-bili-whale-dashboard/releases/latest) and enter the file's **absolute local path** in the same installation field. Do not extract it or choose GitHub's automatically generated **Source code** archives.

<details>
<summary>Command-line installation (optional)</summary>

Existing DSH Web users can also run:

```sh
dsh plugin --profile web add https://github.com/Cansiny0320/dsh-bili-whale-dashboard/releases/download/v0.1.0/dsh-bili-whale-dashboard-0.1.0.tgz
dsh web --port 3081
```

Install and start the same profile used by the original plugin. Desktop users should use the application's Add plugin interface.

</details>

### 2. Open the dashboard from DSH

Open **Settings → 鲸鱼娘后台 → 打开鲸鱼娘后台** in DSH. This entry checks the original plugin and tells you if it needs to be installed or enabled. Click **重新检查** (Check again) after resolving that.

The dashboard is served by the same DSH instance at `/whale-dashboard/`. For DSH on port 3081, the address is [http://127.0.0.1:3081/whale-dashboard/](http://127.0.0.1:3081/whale-dashboard/). Use the same browser where you authenticated with DSH.

### 3. Initial configuration

For a new original-plugin installation, configure an available model under **DSH Settings → Models**. Then use **Settings → 养鱼** to sign in to Bilibili, set the sharing recipient's UID (mid) and nickname, and run **依赖体检** (Dependency check). Use the cookie import or QR login offered by your original-plugin version. Model credentials and Bilibili login are configured there, not in this dashboard.

Find the `bili-whale` session created by the original plugin and confirm its model and tool execution permissions. Video frame extraction requires ffmpeg; follow the original plugin's dependency instructions.

### Daily use

1. **人设与偏好** (Personality and preferences): edit names, personality text and topics, using the separate save buttons.
2. **作息与监听 / 设置** (Schedules and listeners / Settings): configure activity windows, wake counts, listeners, sharing recipients, channels and notifications, then save.
3. **概览 / 日记** (Overview / Diaries): read activity records and diaries. Use the top-right refresh button for current data. Empty lists are normal for a new account.
4. **待审回复** (Reply reviews): compare drafts before rejecting or approving. Approval in live mode sends a Bilibili comment.

Keep **DSH running**; no separate dashboard service is needed. Closing the browser tab does not stop the original tasks. Stopping DSH stops scheduling in that host process.

### Updating and uninstalling

Remove the old dashboard plugin in DSH, install the new Release `.tgz`, and enable it. **Remove only the dashboard, keep the original plugin, and do not delete data directories.** Uninstalling this dashboard does not delete the original login state, configuration, diaries or approval records.

### Common startup problems

| Problem                                        | What to check                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| DSH version is incompatible                    | Use the DSH version supported by the package or choose a matching Release.                                                 |
| GitHub package cannot be downloaded            | Download the Release `.tgz` first and enter its absolute local path. An npm mirror does not replace GitHub file downloads. |
| Original plugin required                       | Install and enable `dsh-bili-whale` in the same DSH instance, then check again.                                            |
| HTTP 401                                       | Authenticate through the DSH launch URL, then use the same browser.                                                        |
| HTTP 404                                       | Enable the dashboard and restart if DSH requests it. Install and browse in the same DSH instance.                          |
| The page says Demo data                        | This is the source-development demo, normally on port 4179. Use the dashboard entry inside DSH instead.                    |
| The dashboard opens but the agent does nothing | Check original-plugin dependencies, scheduler status, and the model and permissions of the `bili-whale` session.           |

See the [usage guide](docs/usage.md) for data locations and recovery. Source builds, the standalone demo and release packaging are covered in the [development guide](docs/development.md). The interface and detailed guides currently use Chinese.

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
pnpm release:pack
pnpm test:package
```

Browser checks use headless Microsoft Edge. Run `pnpm test:dsh` after setting up the isolated DSH installation to test the real host. Tests do not invoke models, send real Bilibili messages or control desktop input.

Currently, 23 unit/integration tests and 6 browser scenarios pass. Browser checks cover readability and overflow across all six pages at widths of 1600, 1280 and 390 pixels, plus saving, diary switching, approval confirmation and duplicate prevention. Sending from a real account has not been verified.

[Usage and troubleshooting](docs/usage.md) · [Source development and packaging](docs/development.md) · [Verification](docs/verification.md) · [Assets and third-party code](THIRD-PARTY-NOTICES.md)

## Sponsorship

If this project is useful to you, you can support its development through WeChat Pay or Alipay. Thank you!

![WeChat Pay and Alipay sponsorship codes](.github/sponsorship/sponsorship-cats.png)

## License and acknowledgements

Released under the [MIT License](LICENSE). Built around the data and APIs of [Alterssss/dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale), retaining the relevant code licenses. The public repository excludes whale-character artwork whose redistribution permission has not been confirmed. Follow the [local portrait guide](apps/dashboard/public/brand/README.md) to add artwork you have permission to use. This is not an official DeepSeek or Bilibili project.

Related projects: [codex-bili-dragon](https://github.com/Cansiny0320/codex-bili-dragon), a Bilibili companion using the official Codex client; and [bili-agent-kit](https://github.com/Cansiny0320/bili-agent-kit), a host-independent Bilibili SDK, CLI and MCP toolkit.
