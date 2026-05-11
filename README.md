# harness-iacm-mcp

A Model Context Protocol (MCP) server for **Harness IaCM** (Infrastructure as Code Management).

It lets AI agents like **Cursor**, **Claude Desktop**, and any MCP-compatible client manage Harness IaCM workspaces, pipelines, runs, state, OPA governance, and feature adoption — and turn the results into beautifully themed live HTML reports / PDFs.

> **Repo:** [github.com/Samriddha11/harness-iacm-finops-agent](https://github.com/Samriddha11/harness-iacm-finops-agent)

---

## Highlights

- **12 MCP tools** covering discovery, listing, drill-down, run triggering, governance scans, maturity scoring, and report rendering
- **Two transports** — stdio (for local CLI / Cursor) and streamable HTTP (for cloud clients)
- **Per-session auth via headers** in HTTP mode — multi-tenant friendly without restarting the server
- **Read-only mode** (`HARNESS_READ_ONLY=true`) blocks all write operations (plans / applies / destroys)
- **Built-in retry, rate-limiting, and request-timeout** controls
- **Live HTML report renderer** with **8 executive themes** (4 light, 4 dark), instant theme switching, scroll-reveal animations, animated counters, theme-driven SVG charts, and an A4-page-perfect cover with the official Harness diamond brand mark — works as on-screen presentation, print-to-PDF, or screenshot-to-PPT
- **URL-aware** — paste any Harness IaCM URL into a tool call and org / project / workspace IDs are auto-extracted
- **Account scanner** — `harness_iacm_scan` can discover every IACM-enabled project across every org with a single empty call

---

## Tools

| Tool | Purpose |
|---|---|
| `harness_iacm_guide` | Returns the full agent guide — call this first in every session |
| `harness_iacm_describe` | Describe a resource type (fields, filters, operations) without making an API call |
| `harness_iacm_list` | List any IaCM resource (orgs, projects, workspaces, runs, variables, state, pipelines, executions) with filters and pagination |
| `harness_iacm_get` | Get a single resource by ID (workspace, run, variable, state) |
| `harness_iacm_run` | Trigger a Terraform/OpenTofu **plan / apply / destroy / plan_and_apply** on a workspace (write-mode) |
| `harness_iacm_scan` | Auto-discover **every IACM-enabled project** across every org and count workspaces + pipelines (no args needed) |
| `harness_iacm_feature_scan` | BVR feature-adoption scan — Checkov, cost estimation, IaCM templates, private registry adoption per pipeline / workspace |
| `harness_iacm_opa_scan` | BVR OPA governance scan — every OPA policy + policy-set, which pipelines have enforcement and which don't |
| `harness_iacm_maturity` | Score the account against a 9-dimension maturity rubric (CRAWL → WALK → RUN → FLY) |
| `harness_iacm_render_report` | Render any markdown report as a **live themed webpage** (8 executive themes, scroll-reveals, animated counters, print-to-PDF) |
| `markdown_to_pdf` | Convert a markdown report to PDF with theme-faithful styling |

> Run `harness_iacm_describe` to see the exact required fields, optional filters, and operations for any of the 12 resource types.

---

## Quick start

### Prerequisites

- **Node.js >= 20**
- **npm**, **pnpm**, or **yarn**
- A Harness account with at least **API key + IaCM access** (a Personal Access Token works)

### Install

```bash
git clone https://github.com/Samriddha11/harness-iacm-finops-agent.git
cd harness-iacm-finops-agent
npm install
npm run build
```

### Configure

```bash
cp .env.example .env
# Edit .env and add your HARNESS_API_KEY (PAT or service-account token)
```

A PAT looks like `pat.<accountId>.<tokenId>.<secret>` — the account ID is **auto-extracted** from the token, so you don't need to set `HARNESS_ACCOUNT_ID` separately when using a PAT.

### Run

```bash
# stdio transport (for local CLIs and Cursor / Claude Desktop)
npm start

# HTTP transport (for cloud clients, REST testing, multi-tenant)
npm run start:http              # binds to :3000
npm run start:http:8080         # binds to :8080
PORT=4000 npm run start:http    # custom port via env

# Auto-rebuild + auto-restart while developing
npm run dev
```

The HTTP server exposes:

```
POST   /mcp     — main MCP endpoint (session-based)
GET    /mcp     — server-sent events stream for the active session
DELETE /mcp     — terminate a session
GET    /health  — health check (returns active session count)
```

---

## Configuration

All settings live in `.env`. See `.env.example` for the full reference.

### Authentication (use ONE)

| Variable | Notes |
|---|---|
| `HARNESS_API_KEY` | PAT or service-account token — `pat.<accountId>.<tokenId>.<secret>`. Account ID is auto-extracted. **Recommended.** |
| `HARNESS_BEARER_TOKEN` | Browser session JWT — useful for CCM / Lightwing endpoints that don't accept PATs |

### Account & scope

| Variable | Default | Notes |
|---|---|---|
| `HARNESS_ACCOUNT_ID` | — | Required when using a bearer token (PAT embeds it) |
| `HARNESS_DEFAULT_ORG_ID` | `default` | Avoids needing to pass `org_id` on every call |
| `HARNESS_DEFAULT_PROJECT_ID` | — | Avoids needing to pass `project_id` on every call |
| `HARNESS_BASE_URL` | `https://app.harness.io` | Override for self-hosted / on-prem Harness |

### Server

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `3000` | HTTP transport port (also settable via `--port` flag) |
| `HOST` | `127.0.0.1` | Bind address — set to `0.0.0.0` for Docker / external access |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |

### Tuning & safety

| Variable | Default | Notes |
|---|---|---|
| `HARNESS_API_TIMEOUT_MS` | `30000` | Per-request timeout |
| `HARNESS_MAX_RETRIES` | `3` | Auto-retry on transient errors |
| `HARNESS_RATE_LIMIT_RPS` | `10` | Outbound rate limit to the Harness API |
| `HARNESS_READ_ONLY` | `false` | Set to `true` to block `harness_iacm_run` and any write operation |

---

## Per-session auth (HTTP mode)

In HTTP mode, you can override credentials per request using headers — this lets one running server serve multiple Harness accounts without restarting.

| Header | Maps to |
|---|---|
| `X-Harness-Api-Key` | `HARNESS_API_KEY` |
| `X-Harness-Token` *or* `Authorization: Bearer …` | `HARNESS_BEARER_TOKEN` |
| `X-Harness-Account` | `HARNESS_ACCOUNT_ID` |
| `X-Harness-Base-Url` | `HARNESS_BASE_URL` |
| `X-Harness-Default-Org` | `HARNESS_DEFAULT_ORG_ID` |
| `X-Harness-Default-Project` | `HARNESS_DEFAULT_PROJECT_ID` |

Headers are read on `initialize` and pinned to that session for its lifetime (idle TTL: 30 min).

---

## Connecting to Cursor

Add the server to your Cursor MCP config (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "harness-iacm": {
      "command": "node",
      "args": ["/absolute/path/to/harness-iacm-finops-agent/build/index.js", "stdio"],
      "env": {
        "HARNESS_API_KEY": "pat.xxxx.xxxx.xxxx"
      }
    }
  }
}
```

Restart Cursor — `harness_iacm_*` tools will appear in the tool palette and be available to the agent.

---

## Connecting to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or the equivalent on Windows / Linux:

```json
{
  "mcpServers": {
    "harness-iacm": {
      "command": "node",
      "args": ["/absolute/path/to/harness-iacm-finops-agent/build/index.js", "stdio"],
      "env": {
        "HARNESS_API_KEY": "pat.xxxx.xxxx.xxxx"
      }
    }
  }
}
```

---

## Inspect with the official MCP inspector

```bash
npm run inspect
```

This launches `@modelcontextprotocol/inspector` against the stdio transport — useful for browsing tools, testing schemas, and debugging.

---

## Report renderer — themed BVRs from markdown

`harness_iacm_render_report` turns any markdown file into a **live themed webpage** with a built-in theme switcher, sidebar TOC, scroll-reveals, animated number counters, and one-click print-to-PDF.

```jsonc
{
  "tool": "harness_iacm_render_report",
  "input_path": "/Users/me/reports/bvr/iacm-bvr.md",
  "theme": "minimal"
}
```

The tool returns a `http://localhost:4321/report/<id>` URL plus the same URL with each theme pre-selected. The render server stays up between calls and serves all registered reports.

### 8 executive themes

| ID | Label | Mode | Mood |
|---|---|---|---|
| `minimal` | **Harness** | Light | Official Harness brand — bright sky blue + deep navy |
| `harness-pro` | **Aurora** | Light | Soft mint + teal — calm premium |
| `kinetic` | **Sandstone** | Light | Warm cream + amber — McKinsey executive |
| `bluestone` | **Bluestone** | Light | Formal navy + slate gray — Goldman / JPM corporate |
| `dark` | **Midnight** | Dark | Deep navy + cool blue — boardroom premium |
| `ocean` | **Eclipse** | Dark | Charcoal + emerald — sophisticated dev-tool |
| `black-lime` | **Obsidian** | Dark | Zinc black + warm gold — luxury (Tesla feel) |
| `carbon` | **Carbon** | Dark | Stone + crimson — premium dark luxury |

### Frontmatter schema

The renderer reads YAML frontmatter at the top of the markdown to drive the cover page:

```yaml
---
title: "IaCM Business Value Review"
subtitle: "Infrastructure as Code Management at enterprise scale"
customer: "TransUnion"
docType: "Business Value Review"
date: "May 11, 2026"
author: "Harness IaCM"
classification: "Confidential"
defaultTheme: "minimal"
heroStats: "2,461|Workspaces; 4,911|Pipelines; 100%|OPA Governed; 74/100|Maturity · RUN"
---
```

`heroStats` accepts up to 4 `value|label` pairs, semicolon-separated — they render as bordered hero tiles on the cover.

### Custom callout blocks

Beyond standard markdown, the renderer supports `:::` directive blocks:

````markdown
::: success
Strong adoption — 100% OPA coverage across all 4,911 pipelines.
:::

::: critical
Cost estimation disabled on all workspaces — the largest remaining gap.
:::

::: action
**P1 — Enable the FinOps policy set.** One configuration toggle.
:::
````

Tones available: `info`, `success`, `warning`, `critical`, `action`, `quote`.

### Dynamic effects (all print-safe)

- **Instant theme switching** — every theme variable is pre-loaded as a `:root[data-theme="X"]` block, JS swaps the attribute and CSS transitions interpolate smoothly over 300ms
- **Scroll-triggered reveals** — sections, callouts, charts, and metric cards fade-in + slide-up as they enter the viewport
- **Animated number counters** — large numeric SVG text (`2,461`, `74/100`, `100%`, etc.) tweens from 0 to its final value with `easeOutCubic` when scrolled into view
- **Auto-recoloured SVG charts** — chart hex codes are mapped to theme variables via CSS attribute selectors, so the same SVG asset renders correctly on every theme without regeneration
- **Hover lift on charts**, **soft pulse on the sidebar brand**, **slow gradient drift on the cover**
- **`prefers-reduced-motion` honoured**; **`beforeprint` event fast-forwards** all animations to a stable final state for clean PDF export

### Chart-regeneration scripts

Reusable Node scripts under `scripts/` regenerate theme-friendly SVG charts:

```bash
node scripts/regen-priority-matrix.mjs reports/<report-id>/assets
node scripts/regen-org-footprint.mjs   reports/<report-id>/assets
```

These produce SVGs that use only hex codes mapped in the theme palette — the result auto-adapts to every theme.

---

## Project structure

```
src/
├── index.ts                  ← entrypoint (stdio + HTTP transport bootstrap)
├── config.ts                 ← env / header parsing
├── client/                   ← HarnessClient (API wrapper, retries, rate-limit)
├── registry/                 ← resource-type registry
├── tools/                    ← MCP tool implementations (12 tools)
│   ├── harness-iacm-guide.ts
│   ├── harness-iacm-describe.ts
│   ├── harness-iacm-list.ts
│   ├── harness-iacm-get.ts
│   ├── harness-iacm-run.ts
│   ├── harness-iacm-scan.ts
│   ├── harness-iacm-feature-scan.ts
│   ├── harness-iacm-opa-scan.ts
│   ├── harness-iacm-maturity.ts
│   ├── harness-iacm-render.ts
│   └── markdown-to-pdf.ts
├── resources/                ← MCP resources
├── prompts/                  ← MCP prompts
├── report-renderer/          ← live HTML report engine
│   ├── server.ts             ← HTTP renderer + cover builder
│   ├── themes.ts             ← 8 themes + dynamic CSS
│   └── markdown-to-html.ts   ← markdown → HTML pipeline
└── utils/                    ← logger, response formatter, URL parser, etc.

scripts/                      ← chart-regeneration scripts (one per chart type)
reports/                      ← sample BVRs + asset folders
```

---

## Development

```bash
npm install
npm run build         # one-shot TypeScript build
npm run dev           # build + watch + auto-restart HTTP server
npm run typecheck     # tsc --noEmit
npm run test          # vitest run
npm run test:watch    # vitest in watch mode
```

### Docker

```bash
npm run docker:build
npm run docker:run    # exposes :3000, reads .env
```

---

## Safety notes

- **Read-only mode**: set `HARNESS_READ_ONLY=true` and `harness_iacm_run` will refuse all `apply` / `destroy` / `plan_and_apply` requests.
- **Rate limits**: outbound API calls are capped at `HARNESS_RATE_LIMIT_RPS` (default 10) and inbound HTTP at 60 req/min per IP.
- **No telemetry**: this server does not phone home. All API traffic goes only to `HARNESS_BASE_URL`.

---

## License

Apache-2.0 — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

Built on the official [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).
