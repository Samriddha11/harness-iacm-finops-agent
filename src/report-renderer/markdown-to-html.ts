import { marked } from "marked";

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
 * Pre-process markdown: extract all ::: blocks before passing to marked.
 * Replaces them with placeholder tokens and returns a map for later restoration.
 */
function preProcess(body: string): { text: string; blocks: string[] } {
  const blocks: string[] = [];

  // Match :::type\n...content...\n::: (closing ::: must be at start of line)
  const text = body.replace(
    /^:::\s*(\w+)\s*\n([\s\S]*?)^:::/gm,
    (_, type: string, inner: string) => {
      let html: string;
      const trimmedInner = inner.trimEnd();

      // Detect metrics block: inner lines contain "label:"
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

  // Restore block placeholders
  html = html.replace(/IACM_BLOCK_(\d+)_PLACEHOLDER/g, (_, idx) => blocks[Number(idx)] ?? "");

  return html;
}
