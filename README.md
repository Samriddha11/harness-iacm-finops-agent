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

### Inline chart fences — data lives in the markdown

Charts can be embedded **directly** in the markdown using a fenced code block with the language `chart <kind>`. The renderer parses the JSON body, validates it via the same Zod schema used by the `harness_iacm_chart` MCP tool, and inlines the SVG at that exact spot. **No separate `.svg` files, no regen step.**

```` markdown
```chart monthly_growth IaCM Growth — Last 12 Months
{
  "title": "IaCM Growth — Last 12 Months",
  "subtitle": "Cumulative workspaces and pipelines",
  "growth": { "workspaces": "+40.4% / 12 mo", "pipelines": "+38.9% / 12 mo" },
  "points": [
    { "label": "Jun '25", "workspaces": 178, "pipelines":  720 },
    { "label": "May '26", "workspaces": 250, "pipelines": 1000 }
  ]
}
```
````

Rules:

- The fence info line is `chart <kind> [optional alt text]`. Alt text is hoisted onto the SVG via `aria-label` for accessibility.
- The body MUST be **strict JSON** — double-quoted keys, no trailing commas, no comments, no JS expressions.
- `<kind>` must be one of: `scorecard`, `maturity_radar`, `feature_gauges`, `opa_donut`, `org_footprint`, `priority_matrix`, `bar`, `monthly_growth`.
- If the JSON is malformed or fails Zod validation, the renderer shows a friendly error callout in place of the chart — the page never breaks.

This is the **recommended pattern for new BVRs** because:

- Editing data in markdown → save → refresh — no `regen-bvr-charts.mjs` step.
- Single source of truth: the markdown file IS the customer report.
- Cross-customer consistency is preserved — every chart still goes through the same canonical generator in `src/charts/`, only the JSON values change.
- Fewer files to manage (no per-customer `assets/*.svg` to keep in sync with markdown).

The legacy `![alt](assets/*.svg)` reference style still works for backward compatibility, but inline fences are simpler to maintain.

### Reusable chart objects (consistency across customers)

Every chart in a BVR is produced by one of seven canonical generators in [`src/charts/generators.ts`](src/charts/generators.ts):

| Chart kind | Use for |
|---|---|
| `scorecard` | Row of headline metric tiles at the top of the report |
| `maturity_radar` | N-axis spider with central score (CRAWL / WALK / RUN / FLY) |
| `feature_gauges` | Circular progress rings for adoption % |
| `opa_donut` | Active vs disabled policy sets + side legend |
| `org_footprint` | Diverging bars (workspaces left, pipelines right) |
| `priority_matrix` | 3-lane recommendation cards (P1/P2/P3) with effort chips |
| `bar` | Generic horizontal bar chart |

Every generator emits hex codes that the theme system in [`src/report-renderer/themes.ts`](src/report-renderer/themes.ts) recolours via CSS attribute selectors — so the same chart automatically adapts to all 8 themes without regeneration.

The chart **styles never change between customers**. Only the data does. That gives every customer report a consistent, polished look.

#### Producing a BVR for a new customer

```bash
# 1. Clone the reference BVR folder
cp -r reports/bvr-2026-05-11 reports/<new-customer>

# 2. Edit the per-customer data file (numbers + names only)
vim reports/<new-customer>/charts.data.mjs

# 3. Edit the markdown narrative + frontmatter
vim reports/<new-customer>/iacm-bvr.md

# 4. Regenerate all 6 SVGs from the canonical chart objects
node scripts/regen-bvr-charts.mjs reports/<new-customer>

# 5. Render via the MCP `harness_iacm_render` tool, or visit
#    http://localhost:<port>/report/<id> after registering it.
```

[`reports/bvr-2026-05-11/charts.data.mjs`](reports/bvr-2026-05-11/charts.data.mjs) is the source-of-truth template — every chart kind is documented inline with the exact data shape it needs. The data is Zod-validated at render time ([`src/charts/index.ts`](src/charts/index.ts)) so bad input fails fast with a clear error.

#### When the agent does it for you

The same generators are exposed as the `harness_iacm_chart` MCP tool ([`src/tools/harness-iacm-chart.ts`](src/tools/harness-iacm-chart.ts)). The `iacm_bvr` prompt orchestrates the full workflow: scan the account, build the chart data, call `harness_iacm_chart` for each chart, write the markdown, render the live URL.

### MCP prompts — opinionated workflows for fast results

Any MCP client (Cursor, Claude Desktop, custom SDK) can invoke these named prompts to get a consistent, polished result without writing the orchestration logic themselves. All chart generation goes through the same canonical `harness_iacm_chart` tool, so style is identical across every prompt and every customer.

| Prompt | What it does | When to use |
|---|---|---|
| `iacm_bvr` | Full Business Value Review: scan → 5 charts → markdown → live URL | First-time customer report, full QBR / EBR pack |
| `iacm_quick_chart` | Render ONE polished SVG (any of the 7 chart kinds) | Drop a chart into a slide deck or email; no full BVR needed |
| `iacm_maturity_check` | Maturity score + tier + radar + ranked path-to-next-tier | Quarterly check-in, "did our score move?", pre-call read |
| `iacm_quick_wins` | Only config-only opportunities (disabled OPA sets + features) | Pre-call ammunition for CSM/TAM, change-window planning |
| `iacm_render` | Render an existing markdown BVR across all 8 themes | Customer wants a different look; markdown was edited |
| `opa_policy_analysis` | OPA-focused adoption report (IaCM-scoped by default) | Governance deep-dive, separate from full BVR |

**Why this guarantees consistency for any client:**

1. The chart **styles** live in code (`src/charts/generators.ts`) — clients cannot accidentally produce off-brand visuals.
2. The chart **data shapes** are Zod-validated at render time — bad input fails fast with a clear error, never produces a broken chart.
3. The chart **palette** is a single shared map (`src/charts/palette.ts`) referenced by every theme — switching themes never breaks a chart.
4. The prompts themselves include the full schema in the prompt text — the LLM doesn't have to guess field names.

#### Calling the prompts from a client

In Cursor / Claude Desktop, open the `/` (slash command) menu and pick the prompt name. The client will fill in the arguments interactively.

For programmatic / SDK access, the prompt name + arguments are the contract:

```jsonc
{
  "name": "iacm_quick_chart",
  "arguments": {
    "chart_kind": "scorecard",
    "output_path": "/Users/me/work/proj/charts/q4-scorecard.svg",
    "ask": "5 tiles: 250 workspaces, 1000 pipelines, 100% OPA, 47/55 active sets, 74/100 maturity"
  }
}
```

#### Example one-liner prompts (paste into chat)

> Run `iacm_bvr` for **TransUnion** with workspace_root `/Users/me/work/iacm-bvr` and theme `minimal`.

> Run `iacm_maturity_check` and write the radar to `/Users/me/work/charts/maturity.svg`.

> Run `iacm_quick_wins` — what can we ship this week with no engineering work?

> Run `iacm_render` for `/Users/me/work/iacm-bvr/reports/<id>/iacm-bvr.md` with theme `bluestone` for the customer call.

> Run `iacm_quick_chart` with chart_kind `org_footprint` to `/Users/me/work/charts/footprint.svg` — top 10 orgs by IaCM footprint.

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
