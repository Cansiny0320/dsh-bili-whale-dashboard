<h1 align="center">DSH Bili Whale Dashboard</h1>
<p align="center">A local dashboard for diaries, reply reviews, personality and schedules.</p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6" alt="Strict TypeScript">
  <img src="https://img.shields.io/badge/DSH-Web-536dfe" alt="DSH Web plugin">
</p>
<p align="center"><a href="#getting-started">Installation</a> · <a href="#daily-use">Daily use</a> · <a href="docs/usage.md">Detailed guide</a> · <a href="https://github.com/Cansiny0320/dsh-bili-whale-dashboard/issues">Issues</a></p>
<p align="center"><a href="README.md">简体中文</a> · <a href="README.en.md">English</a></p>

A dashboard for [dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale), with public and private diaries, reply reviews, personality settings and schedules. Install the original plugin and this dashboard in DSH, then open the dashboard from Settings. The original plugin handles Bilibili login and runs the agent.

![Dashboard with demo data](docs/images/dashboard.png)

<details>
<summary>More screenshots: diaries, reply reviews, personality and preferences</summary>

**Diaries**

![Diary reader](docs/images/diaries.png)

**Reply reviews**

![Pending reply reviews](docs/images/reviews.png)

**Personality and preferences**

![Personality and preferences](docs/images/persona.png)

</details>

## What can it do?

| Page                        | Features                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| Overview                    | Check activity schedules, sharing progress, pending replies and recent events.                      |
| Diaries                     | Search and read public and private diaries, including the original text.                            |
| Reply reviews               | Compare draft replies with the original comments, then send or reject them.                         |
| Personality and preferences | Edit names, personality, topics of interest and aliases.                                            |
| Schedules and listeners     | Set activity times, wake counts, rest probability and monitoring for comments, DMs and livestreams. |
| Settings                    | Choose sharing recipients, notifications and request limits, and view account information.          |

Works in desktop and mobile browsers. Screenshots use demo data. The interface displays a text title by default; see the [local portrait guide](apps/dashboard/public/brand/README.md) to add an avatar.

## Getting started

**Install and enable the original [dsh-bili-whale plugin](https://github.com/Alterssss/dsh-bili-whale) in the same DSH instance first.** It handles Bilibili login and agent tasks; this plugin provides the management interface. The two plugins are installed and upgraded independently.

The dashboard ships as a prebuilt package: **no repository clone, pnpm commands or manual build required**. The current package supports **DSH 0.2.1-rc.2**. Installation and use have been checked in DSH Web with original plugin v0.4.6. Opening the dashboard from DSH Desktop has not been tested separately.

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

Open **Settings → 鲸鱼娘后台 → 打开鲸鱼娘后台** in DSH. If DSH reports that the original plugin is missing, install and enable it, then click **重新检查** (Check again).

The dashboard is served by the same DSH instance at `/whale-dashboard/`. For DSH on port 3081, the address is [http://127.0.0.1:3081/whale-dashboard/](http://127.0.0.1:3081/whale-dashboard/). Use the same browser where you authenticated with DSH.

### 3. Initial configuration

For a new original-plugin installation, configure an available model under **DSH Settings → Models**. Then use **Settings → 养鱼** to sign in to Bilibili, set the sharing recipient's UID (mid) and nickname, and run **依赖体检** (Dependency check). Use the cookie import or QR login offered by your original-plugin version. Model credentials and Bilibili login are configured there, not in this dashboard.

Find the `bili-whale` session created by the original plugin and confirm its model and tool execution permissions. Video frame extraction requires ffmpeg; follow the original plugin's dependency instructions.

### Daily use

1. **人设与偏好** (Personality and preferences): edit names, personality text and topics, using the separate save buttons.
2. **作息与监听 / 设置** (Schedules and listeners / Settings): configure activity windows, wake counts, listeners, sharing recipients, channels and notifications, then save.
3. **概览 / 日记** (Overview / Diaries): read activity records and diaries. Use the top-right refresh button for current data. Empty lists are normal for a new account.
4. **待审回复** (Reply reviews): compare drafts before rejecting or approving. Approval in live mode sends a Bilibili comment.

Keep **DSH running**; no separate dashboard service is needed. Closing the browser tab does not stop the original tasks. Quitting DSH stops the agent's scheduled tasks.

### Updating and uninstalling

Remove the old dashboard plugin in DSH, install the new Release `.tgz`, and enable it. **Remove only the dashboard, keep the original plugin, and do not delete data directories.** Uninstalling this dashboard does not delete the original login state, configuration, diaries or approval records.

### Troubleshooting

| Problem                                        | What to check                                                                                                    |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| DSH version is incompatible                    | Use the DSH version supported by the package or choose a matching Release.                                       |
| GitHub package cannot be downloaded            | Download the Release `.tgz` first and enter its absolute local path.                                             |
| Original plugin required                       | Install and enable `dsh-bili-whale` in the same DSH instance, then check again.                                  |
| HTTP 401                                       | Authenticate through the DSH launch URL, then use the same browser.                                              |
| HTTP 404                                       | Enable the dashboard and restart if DSH requests it. Install and browse in the same DSH instance.                |
| The page says Demo data                        | This is the source-development demo, normally on port 4179. Use the dashboard entry inside DSH instead.          |
| The dashboard opens but the agent does nothing | Check original-plugin dependencies, scheduler status, and the model and permissions of the `bili-whale` session. |

See the [usage guide](docs/usage.md) for data locations and recovery. Source builds, the standalone demo and release packaging are covered in the [development guide](docs/development.md). The interface and detailed guides currently use Chinese.

## Data and permissions

The dashboard shares data with the original plugin, so saved changes affect its settings and personality. It does not read account cookies; sign in through the original plugin.

If a send result is unclear, the dashboard keeps a record and does not retry automatically. If another program has changed the settings, it reports a conflict. See the [recovery guide](docs/usage.md#保存和审批语义) for what to do next.

## Development and documentation

Built with TypeScript, React and TanStack Start. See the [development guide](docs/development.md) for setup, the local demo and release packaging.

```sh
pnpm check
pnpm test
pnpm build
pnpm test:e2e
pnpm release:pack
pnpm test:package
```

Page interactions and installation in DSH have been checked using demo data. Sending from a real Bilibili account has not been verified. See the [verification notes](docs/verification.md) for test environments and results.

[Usage and troubleshooting](docs/usage.md) · [Source development and packaging](docs/development.md) · [Verification](docs/verification.md) · [Assets and third-party code](THIRD-PARTY-NOTICES.md)

## Sponsorship

If this project is useful to you, you can support its development through WeChat Pay or Alipay. Thank you!

![WeChat Pay and Alipay sponsorship codes](.github/sponsorship/sponsorship-cats.png)

## License and acknowledgements

Released under the [MIT License](LICENSE). Built around the data and APIs of [Alterssss/dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale), retaining the relevant code licenses. The public repository excludes whale-character artwork whose redistribution permission has not been confirmed. Follow the [local portrait guide](apps/dashboard/public/brand/README.md) to add artwork you have permission to use. This is not an official DeepSeek or Bilibili project.

Related projects: [codex-bili-dragon](https://github.com/Cansiny0320/codex-bili-dragon), a Bilibili companion using the official Codex client; and [bili-agent-kit](https://github.com/Cansiny0320/bili-agent-kit), a Bilibili SDK, CLI and MCP toolkit for connecting to different AI assistants.
