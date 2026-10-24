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

Three components work together:

| Component                                                                     | Responsibility                                                                                          |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| DSH Web                                                                       | Provides models, sessions and the web server.                                                           |
| Original [dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale) plugin | Manages Bilibili login, scheduling, video viewing, diary writing and sending messages.                  |
| This dashboard                                                                | Reads the same diaries and state; calls the original plugin's APIs to save settings and review replies. |

**Install both plugins in the same DSH Web profile.** The dashboard starts with `dsh web`; it needs no separate web server. The verified combination is **DSH 0.2.1-rc.2 + original plugin v0.4.6**.

### 1. Download both projects and build the dashboard

Install Git and **Node.js 24.11+ within 24.x or 26+** first. These commands use Windows PowerShell. Start in your chosen projects directory and keep the repositories side by side:

```powershell
git clone https://github.com/Alterssss/dsh-bili-whale.git
git clone https://github.com/Cansiny0320/dsh-bili-whale-dashboard.git
cd dsh-bili-whale-dashboard

# Install project-local pnpm and dependencies, then build
& .\scripts\bootstrap.ps1
& .\scripts\pnpm.ps1 build

# Absolute paths for the installation commands below
$whalePlugin = (Resolve-Path ..\dsh-bili-whale).Path.Replace('\', '/')
$whaleDashboard = (Get-Location).Path.Replace('\', '/')
```

If you already have the original repository, skip cloning it and point `$whalePlugin` to that directory. On macOS / Linux, or with pnpm already installed, build with `pnpm install --frozen-lockfile` and `pnpm build`, then use the existing-DSH commands below with your own absolute paths. The interface and detailed usage guide currently use Chinese.

### 2. Install both plugins in DSH and start it

**If you already use DSH Web**, run these in the same PowerShell session:

```powershell
dsh plugin --profile web add "link:$whalePlugin" "link:$whaleDashboard"
dsh web --port 3081
```

If DSH is running, stop the old process after installation, then start it again. This route uses your existing DSH accounts and data. With a custom Web profile, target that same profile for both installation and startup; see the [integration guide](docs/usage.md#dsh-同源插件).

**If you do not have DSH yet**, use this complete sequence instead, in the same PowerShell session, to create a project-specific environment:

```powershell
& .\scripts\pnpm.ps1 exec npm install --prefix .tools/dsh --no-audit --no-fund @deepseek-ai/dsh@0.2.1-rc.2
& .\scripts\pnpm.ps1 dsh web --dump-default-config
& .\scripts\pnpm.ps1 dsh plugin --profile web add "link:$whalePlugin" "link:$whaleDashboard"
& .\scripts\pnpm.ps1 dsh web --port 3081
```

This environment stores its data in `.local/dsh-user/`. Configure models and Bilibili login again here: it does not automatically use accounts or data from another DSH installation. Choose one of the two routes above.

### 3. Complete initial setup in DSH

DSH automatically opens a browser launch URL containing authentication information. Authenticate there first, then configure the following in the **main DSH interface**:

1. **Settings → Models**: configure a model provider and its credentials.
2. **Settings → 养鱼**: sign in to Bilibili. Original v0.4.6 uses cookie import; enter `SESSDATA`, `bili_jct` and the other fields requested by the page. If your installed plugin provides a QR login option, you can use it. Login belongs to the original plugin, not this dashboard.
3. On the same plugin settings page, enter the sharing recipient's **Bilibili UID (mid) and nickname**, save, then run **依赖体检** (dependency check). Video frame extraction requires ffmpeg; without it, visual video analysis is limited.
4. Find the original plugin's **`bili-whale` session** in the workspace, usually under **未分组** (Ungrouped). Select an available model and configure the tool execution and working-directory permissions required by the original plugin.

### 4. Open the live dashboard

In the **same browser where you authenticated**, open:

**[http://127.0.0.1:3081/whale-dashboard/](http://127.0.0.1:3081/whale-dashboard/)**

This address manages the original plugin's real data in that DSH instance. The sidebar contains six pages. Empty diary and review lists are normal for a new account. Replace `3081` if you chose a different DSH port.

### Daily use

1. Set names, personality text and topics under **人设与偏好** (Personality and preferences), using the separate save buttons.
2. Configure activity windows, wake counts and listeners under **作息与监听** (Schedules and listeners). Set sharing recipients, channels and notifications under **设置** (Settings), then save.
3. Keep the **DSH process running**. The original plugin runs scheduled tasks. Closing the dashboard tab does not stop it; stopping DSH stops scheduling in that host process.
4. Read results in **概览 / 日记** (Overview / Diaries), using the top-right refresh button for current records. Review drafts under **待审回复** (Reply reviews), then reject or approve. In live mode, approval sends a Bilibili comment.

Next time, run only the startup command for your chosen route from the project directory: `dsh web --port 3081` for an existing DSH installation, or `& .\scripts\pnpm.ps1 dsh web --port 3081` for the project-specific environment. After changing dashboard code, rebuild and restart DSH.

### Just want to preview the interface?

After step 1, run `& .\scripts\pnpm.ps1 preview` and open the **[standalone demo](http://127.0.0.1:4179/whale-dashboard/)**. It uses samples in `.local/demo/`, requires no DSH or Bilibili account, and changes only demo data when saving or approving. The page displays **演示数据** (Demo data).

### Common startup problems

| Problem                                        | What to check                                                                                                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The page always says Demo data                 | Port `4179` serves the demo. Use `/whale-dashboard/` on your DSH port for real data.                                                                                                   |
| HTTP 401                                       | Authenticate through the launch URL opened by DSH, then open the dashboard in the same browser.                                                                                        |
| HTTP 404                                       | Build the dashboard, install both plugins into the same Web profile and restart DSH after installation.                                                                                |
| Existing diaries or login are missing          | Check whether you started a new project-specific environment; its data directory differs from your existing DSH installation.                                                          |
| The dashboard opens but the agent does nothing | Check dependencies and scheduler status in DSH's plugin settings, then the model and permissions of the `bili-whale` session. Dashboard records do not prove the scheduler is running. |

See the [usage guide](docs/usage.md) for additional installation options, data directories and recovery instructions.

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
