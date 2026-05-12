import { marked } from "marked";
import { ChartKindSchema, renderChart, CHART_KINDS } from "../charts/index.js";

export interface FrontMatter {
  title?: string;
  subtitle?: string;
  customer?: string;
  docType?: string;
  date?: string;
  author?: string;
  classification?: string;
  /**
   * Hero stats for the cover page, semicolon-separated value|label pairs:
   *   heroStats: "2,461|Workspaces; 4,911|Pipelines; 100%|OPA Governed; 74/100|Maturity"
   * Up to 4 stats are rendered as bordered hero tiles on the cover.
   */
  heroStats?: string;
}

export function parseFrontMatter(content: string): { fm: FrontMatter; body: string } {
  const lines = content.split("\n");
  const fm: FrontMatter = {};
  let bodyStart = 0;

  if (lines[0] === "---") {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (line === "---") { bodyStart = i + 1; break; }
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim() as keyof FrontMatter;
        const val = line.slice(colonIdx + 1).trim().replace(/^"|"$/g, "");
        (fm as Record<string, string>)[key] = val;
      }
    }
  }

  return { fm, body: lines.slice(bodyStart).join("\n") };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, `<code>$1</code>`)
    .replace(/\[(.+?)\]\((.+?)\)/g, `<a href="$2">$1</a>`);
}

/**
 * Parse a ::: metrics block.
 * Input lines look like:
 *   - label: My Label
 *     value: "42"
 *     trend: +5%
 *     tone: positive
 *   - label: ...
 */
function parseMetricsBlock(inner: string): string {
  // Split into card groups — each card starts with a line containing "label:"
  const lines = inner.split("\n").map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);

  // Group lines into card objects
  const cards: Array<{ label: string; value: string; trend?: string; tone?: string }> = [];
  let cur: Record<string, string> = {};

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const val = line.slice(colonIdx + 1).trim().replace(/^"|"$/g, "");

    if (key === "label" && cur["label"]) {
      // Start of a new card — push current if complete
      if (cur["value"]) cards.push(cur as { label: string; value: string; trend?: string; tone?: string });
      cur = {};
    }
    cur[key] = val;
  }
  // Push final card
  if (cur["label"] && cur["value"]) {
    cards.push(cur as { label: string; value: string; trend?: string; tone?: string });
  }

  if (!cards.length) return "";

  const cardHtml = cards.map((c) => {
    const toneClass = c.tone ? ` ${c.tone}` : "";
    return `<div class="metric-card${toneClass}">
  <div class="metric-label">${esc(c.label)}</div>
  <div class="metric-value">${esc(c.value)}</div>
  ${c.trend ? `<div class="metric-trend">${esc(c.trend)}</div>` : ""}
</div>`;
  }).join("\n");

  return `<div class="metrics-grid">${cardHtml}</div>`;
}

/**
 * Parse and render a ::: callout block.
 */
function parseCalloutBlock(type: string, inner: string): string {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  const body = inlineMarkdown(
    inner.trim()
      .replace(/\n\n+/g, "</p><p>")
      .replace(/\n/g, " "),
  );
  return `<div class="callout ${type}">
  <span class="callout-badge">${label}</span>
  <div class="callout-body"><p>${body}</p></div>
</div>`;
}

/**
 * Colour-code table cell content.
 */
function colorCell(text: string): string {
  const t = text.trim();
  // Status colouring
  if (/^(yes|active|enabled|100%)$/i.test(t))  return `<span class="status-yes">${esc(t)}</span>`;
  if (/^(no|failed|disabled)$/i.test(t))        return `<span class="status-no">${esc(t)}</span>`;
  if (/apply.needed|dormant|pipeline only/i.test(t)) return `<span class="status-warn">${esc(t)}</span>`;
  // P-priority badge
  if (/^P\d\s*—/.test(t)) {
    const [badge, ...rest] = t.split("—");
    const cls = (badge?.trim() ?? "P1") === "P1" ? "badge-p1" : (badge?.trim() ?? "") === "P2" ? "badge-p2" : "badge-p3";
    return `<span class="${cls}">${esc(badge?.trim() ?? "")}</span> ${esc(rest.join("—").trim())}`;
  }
  return inlineMarkdown(esc(t));
}

/**
 * Render an inline chart fence — `\`\`\`chart <kind>` + JSON data.
 *
 * The fence body MUST be valid JSON (no comments, no trailing commas, no
 * unquoted keys). The chart_kind comes from the fence info string. Data
 * is validated via the same Zod schema used by the `harness_iacm_chart`
 * MCP tool, so any drift between inline charts and tool-generated charts
 * is impossible.
 *
 * Two ways to caption / alt-text the chart:
 *   1. Add `"title": "..."` inside the data — the chart's built-in title
 *      slot renders it inside the SVG (matches the look of file-based
 *      charts).
 *   2. Add `// caption: ...` (NOT supported — use a markdown line
 *      immediately after the fence instead).
 */
function renderChartFence(infoLine: string, body: string): string {
  // infoLine is "chart <kind> [optional alt text...]"
  const m = /^chart\s+([A-Za-z_][\w-]*)(?:\s+(.+))?$/i.exec(infoLine.trim());
  if (!m) {
    return chartError(
      `Bad chart fence header: \`${infoLine}\`. Expected \`chart <kind>\` where <kind> is one of: ${CHART_KINDS.join(", ")}.`,
    );
  }
  const kind = m[1]!;
  const altText = (m[2] ?? "").trim();

  if (!(CHART_KINDS as readonly string[]).includes(kind)) {
    return chartError(
      `Unknown chart kind: \`${kind}\`. Valid kinds: ${CHART_KINDS.join(", ")}.`,
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch (err) {
    return chartError(
      `Chart \`${kind}\` — could not parse data as JSON: ${(err as Error).message}. ` +
      `Use strict JSON (double-quoted keys, no trailing commas, no comments).`,
    );
  }

  const parsed = ChartKindSchema.safeParse({ chart_kind: kind, data });
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((iss) => `${iss.path.join(".") || "(root)"}: ${iss.message}`)
      .join("; ");
    return chartError(`Chart \`${kind}\` — data failed validation: ${issues}`);
  }

  let svg: string;
  try {
    svg = renderChart(parsed.data);
  } catch (err) {
    return chartError(`Chart \`${kind}\` — render failed: ${(err as Error).message}`);
  }

  // Hoist alt text onto the SVG itself for accessibility, and wrap in a
  // <figure> so existing CSS (figure svg, figure { break-inside: avoid })
  // applies identically to file-based charts.
  const accessibleSvg = altText
    ? svg.replace(
        /<svg\b/,
        `<svg role="img" aria-label="${esc(altText)}"`,
      )
    : svg.replace(/<svg\b/, `<svg role="img"`);

  return `<figure>${accessibleSvg}</figure>`;
}

function chartError(msg: string): string {
  return `<div class="callout critical">
  <span class="callout-badge">Chart error</span>
  <div class="callout-body"><p>${esc(msg)}</p></div>
</div>`;
}

/**
 * Pre-process markdown: extract all ::: blocks AND inline chart fences
 * before passing to marked. Replaces them with placeholder tokens and
 * returns a map for later restoration.
 */
function preProcess(body: string): { text: string; blocks: string[] } {
  const blocks: string[] = [];

  // 1. Inline chart fences — \`\`\`chart <kind> [optional alt text]\n...JSON...\n\`\`\`
  //    Closing fence must be at start of a line. The info line is everything
  //    after the opening fence up to (but not including) the newline; we use
  //    [^\n]* (not \s+) for the alt text so it can NEVER swallow the body.
  let text = body.replace(
    /^```[ \t]*(chart[ \t]+[A-Za-z_][\w-]*[^\n]*)\n([\s\S]*?)^```[ \t]*$/gm,
    (_, info: string, inner: string) => {
      const html = renderChartFence(info, inner);
      const idx = blocks.push(html) - 1;
      return `IACM_BLOCK_${idx}_PLACEHOLDER`;
    },
  );

  // 2. ::: callout / metrics blocks
  text = text.replace(
    /^:::\s*(\w+)\s*\n([\s\S]*?)^:::/gm,
    (_, type: string, inner: string) => {
      let html: string;
      const trimmedInner = inner.trimEnd();

      const isMetrics = trimmedInner.split("\n").some(
        (l) => l.replace(/^\s*-?\s*/, "").trimStart().toLowerCase().startsWith("label:"),
      );

      if (isMetrics) {
        html = parseMetricsBlock(trimmedInner);
      } else {
        html = parseCalloutBlock(type, trimmedInner);
      }

      const idx = blocks.push(html) - 1;
      return `IACM_BLOCK_${idx}_PLACEHOLDER`;
    },
  );

  return { text, blocks };
}

/**
 * Full pipeline: markdown → HTML with custom blocks.
 */
export function markdownToHtml(markdownBody: string): string {
  const { text: processed, blocks } = preProcess(markdownBody);

  // Configure marked for table rendering
  const renderer = new marked.Renderer();

  renderer.table = (token) => {
    const { header, rows } = token;
    const heads = header
      .map((h) => `<th>${inlineMarkdown(esc(h.text))}</th>`)
      .join("");
    const bodyRows = rows
      .map((row) => `<tr>${row.map((c) => `<td>${colorCell(c.text)}</td>`).join("")}</tr>`)
      .join("\n");
    return `<div class="table-wrap"><table>
  <thead><tr>${heads}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table></div>`;
  };

  // Run marked
  let html = marked.parse(processed, { renderer }) as string;

  // Restore block placeholders. marked has wrapped each placeholder in <p>…</p>
  // (it sees them as plain-text paragraphs), but the blocks they stand in for
  // (<figure>, <div class="callout">, <div class="metrics-grid">) are all
  // block-level. Browsers auto-close the <p> before the block, producing an
  // empty <p></p> followed by the figure/div — invalid HTML that confuses
  // Safari's page-break engine and contributed to the phantom blank page
  // between the cover and the first section. So we strip the wrapping <p>
  // first, then fall back to a bare replace for any unwrapped placeholders.
  html = html.replace(
    /<p>\s*IACM_BLOCK_(\d+)_PLACEHOLDER\s*<\/p>/g,
    (_, idx) => blocks[Number(idx)] ?? "",
  );
  html = html.replace(
    /IACM_BLOCK_(\d+)_PLACEHOLDER/g,
    (_, idx) => blocks[Number(idx)] ?? "",
  );

  return html;
}
