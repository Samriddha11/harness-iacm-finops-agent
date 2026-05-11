import { createServer, type Server } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, dirname, join, resolve } from "node:path";
import { createLogger } from "../utils/logger.js";
import { THEMES, buildThemeStyleTag, type ThemeId } from "./themes.js";
import { parseFrontMatter, markdownToHtml } from "./markdown-to-html.js";

const log = createLogger("report-renderer");

const THEME_IDS = Object.keys(THEMES) as ThemeId[];

interface RegisteredReport {
  markdownPath: string;
  defaultTheme: ThemeId;
}

const reports = new Map<string, RegisteredReport>();
let httpServer: Server | null = null;
let boundPort = 0;

export function registerReport(id: string, markdownPath: string, defaultTheme: ThemeId): void {
  // Always store absolute path so asset resolution works regardless of CWD
  reports.set(id, { markdownPath: resolve(markdownPath), defaultTheme });
}

export function getReportUrl(id: string): string {
  return `http://localhost:${boundPort}/report/${id}`;
}

function mimeType(ext: string): string {
  const map: Record<string, string> = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
    ".css": "text/css", ".js": "application/javascript", ".pdf": "application/pdf",
  };
  return map[ext] ?? "application/octet-stream";
}

/** Rewrite relative asset paths in HTML to absolute /report/:id/ URLs */
function rewriteAssetPaths(html: string, reportId: string): string {
  return html.replace(
    /(<img[^>]+src=["'])(?!https?:\/\/|\/|data:)([^"']+)(["'])/g,
    (_, pre, path, post) => `${pre}/report/${reportId}/${path}${post}`,
  );
}

/**
 * Inline SVG files directly into the HTML instead of using <img> tags.
 * This guarantees SVGs render correctly in both browser and print-to-PDF
 * (browsers often refuse to render SVG <img> src="localhost/..." in print mode).
 */
function inlineSvgImages(html: string, markdownDir: string): string {
  return html.replace(
    /<img([^>]*?)src=["']([^"']+\.svg)["']([^>]*?)(?:\s*\/)?>/gi,
    (fullTag, pre, src, post) => {
      // Build the absolute file path
      const assetPath = src.startsWith("/report/")
        ? join(markdownDir, src.replace(/^\/report\/[^/]+\//, ""))
        : join(markdownDir, src);

      if (!existsSync(assetPath)) return fullTag; // leave unchanged if not found

      try {
        let svgContent = readFileSync(assetPath, "utf-8").trim();

        // Extract alt text for accessibility
        const altMatch = (pre + post).match(/alt=["']([^"']*)["']/i);
        const altText = altMatch ? altMatch[1] : "";

        // Strip the XML declaration if present
        svgContent = svgContent.replace(/^<\?xml[^>]*\?>\s*/i, "");

        // Add inline styles to the <svg> root: full width, block display
        svgContent = svgContent.replace(
          /^(<svg\b)/i,
          `$1 role="img" aria-label="${altText}" style="width:100%;height:auto;display:block;margin:20px 0"`,
        );

        return `<figure style="margin:0">${svgContent}</figure>`;
      } catch {
        return fullTag;
      }
    },
  );
}

/** Extract headings from HTML for sidebar TOC */
function extractHeadings(html: string): Array<{ level: number; id: string; text: string }> {
  const headings: Array<{ level: number; id: string; text: string }> = [];
  const regex = /<h([123])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[123]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]!, 10);
    const id = match[2]!;
    const text = match[3]!.replace(/<[^>]+>/g, "").trim();
    if (text) headings.push({ level, id, text });
  }
  return headings;
}

/** Inject id attributes into headings for scroll anchoring */
function injectHeadingIds(html: string): string {
  let counters: Record<number, number> = {};
  return html.replace(/<h([123])([^>]*)>(.*?)<\/h[123]>/gi, (_, level, attrs, content) => {
    const lvl = parseInt(level, 10);
    counters[lvl] = (counters[lvl] ?? 0) + 1;
    // Reset sub-counters
    for (let i = lvl + 1; i <= 3; i++) counters[i] = 0;

    if (attrs.includes('id="')) return `<h${level}${attrs}>${content}</h${level}>`;

    const text = content.replace(/<[^>]+>/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60);
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
  });
}

/**
 * Parse the optional `heroStats` frontmatter field into structured tiles.
 * Format: `"value|label; value|label; ..."` (semicolon-separated pairs).
 * Up to 4 stats are rendered.
 */
function parseHeroStats(raw: string | undefined): Array<{ value: string; label: string }> {
  if (!raw) return [];
  return raw
    .split(";")
    .map((chunk) => {
      const [value, label] = chunk.split("|").map((s) => (s ?? "").trim());
      return { value: value ?? "", label: label ?? "" };
    })
    .filter((s) => s.value && s.label)
    .slice(0, 4);
}

/** Build the executive cover page HTML from frontmatter. */
function buildCoverHtml(fm: import("./markdown-to-html.js").FrontMatter): string {
  const customer       = (fm.customer ?? "").replace(/^Account:\s*/, "").trim();
  const heroStats      = parseHeroStats(fm.heroStats);
  const classification = fm.classification ?? "";

  // Harness brand mark — four diamonds in a '+' pattern, all sharing the
  // centre point. Scales cleanly to any size (uses currentColor so theme
  // accent flows through via CSS).
  const brandMark = `
    <svg class="cover-brand-mark" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g class="harness-mark">
        <polygon points="12,1 17.5,6.5 12,12 6.5,6.5"/>
        <polygon points="23,12 17.5,17.5 12,12 17.5,6.5"/>
        <polygon points="12,23 6.5,17.5 12,12 17.5,17.5"/>
        <polygon points="1,12 6.5,6.5 12,12 6.5,17.5"/>
      </g>
    </svg>
  `;

  const heroStatsHtml = heroStats.length
    ? `<div class="cover-stats">
        ${heroStats.map((s, i) => `
          <div class="cover-stat-tile" data-tile="${i + 1}">
            <div class="cover-stat-value">${s.value}</div>
            <div class="cover-stat-label">${s.label}</div>
          </div>
        `).join("")}
       </div>`
    : "";

  const footerItems = [
    fm.date          ? { label: "Date",            value: fm.date }          : null,
    fm.author        ? { label: "Prepared By",     value: fm.author }        : null,
    classification   ? { label: "Confidentiality", value: classification }   : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const footerHtml = footerItems.length
    ? `<div class="cover-footer">
        ${footerItems.map((it) => `
          <div class="cover-footer-item">
            <div class="cover-footer-label">${it.label}</div>
            <div class="cover-footer-value">${it.value}</div>
          </div>
        `).join("")}
       </div>`
    : "";

  return `
    <section class="cover">
      <div class="cover-grid-overlay" aria-hidden="true"></div>

      <div class="cover-topbar">
        <div class="cover-brand">
          ${brandMark}
          <span class="cover-brand-text">Harness</span>
          <span class="cover-brand-sep">·</span>
          <span class="cover-brand-product">IaCM</span>
        </div>
        ${classification ? `<div class="cover-stamp">${classification}</div>` : ""}
      </div>

      <div class="cover-hero">
        ${fm.docType  ? `<div class="cover-eyebrow">${fm.docType}</div>` : ""}
        <h1 class="cover-title">${fm.title ?? "Business Value Review"}</h1>
        ${fm.subtitle ? `<div class="cover-subtitle">${fm.subtitle}</div>` : ""}

        <div class="cover-accent-rule"></div>

        ${customer ? `
          <div class="cover-customer-block">
            <div class="cover-prepared-label">Prepared for</div>
            <div class="cover-customer-name">${customer}</div>
          </div>
        ` : ""}
      </div>

      ${heroStatsHtml}
      ${footerHtml}
    </section>
  `;
}

function buildPage(report: RegisteredReport, themeId: ThemeId, reportId: string): string {
  const content = readFileSync(report.markdownPath, "utf-8");
  const { fm, body } = parseFrontMatter(content);
  let htmlBody = markdownToHtml(body);
  htmlBody = injectHeadingIds(htmlBody);
  // Inline SVGs first (renders in browser + PDF); then rewrite remaining non-SVG assets
  const markdownDir = dirname(report.markdownPath);
  htmlBody = inlineSvgImages(htmlBody, markdownDir);
  htmlBody = rewriteAssetPaths(htmlBody, reportId);

  const headings = extractHeadings(htmlBody);

  const themeOptions = THEME_IDS.map((id) =>
    `<option value="${id}" ${id === themeId ? "selected" : ""}>${THEMES[id]!.label}</option>`,
  ).join("");

  // Build sidebar navigation items
  const navItems = headings.map(({ level, id, text }) => {
    const indent = level === 1 ? "" : level === 2 ? "style=\"padding-left:14px\"" : "style=\"padding-left:26px;font-size:11px\"";
    const cls = level === 1 ? "nav-h1" : level === 2 ? "nav-h2" : "nav-h3";
    return `<a href="#${id}" class="nav-link ${cls}" ${indent} data-id="${id}">${text}</a>`;
  }).join("\n");

  const metaItem = (label: string, value: string) =>
    `<div class="sidebar-meta-item"><span class="sidebar-meta-label">${label}</span><span class="sidebar-meta-value">${value}</span></div>`;

  const sidebarMeta = [
    fm.customer       ? metaItem("Customer", fm.customer.replace("Account: ", "")) : "",
    fm.date           ? metaItem("Date", fm.date) : "",
    fm.classification ? metaItem("Classification", fm.classification) : "",
  ].filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="en" data-theme="${themeId}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${fm.title ?? "IaCM Report"}</title>
${buildThemeStyleTag(themeId)}
<style>
/* ── Layout ──────────────────────────────────────────────────────────────── */
html, body { height: 100%; overflow: hidden; }

.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg, #0a0a0a);
  border-right: 1px solid var(--sidebar-border, rgba(255,255,255,0.06));
  position: relative; z-index: 10;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.sidebar::-webkit-scrollbar { width: 3px; }
.sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

/* ── Top section ─────────────────────────────────────────────────────────── */
.sb-top {
  padding: 20px 18px 14px;
  border-bottom: 1px solid var(--sidebar-border, rgba(255,255,255,0.06));
  flex-shrink: 0;
}
.sb-index-label {
  font-size: 8px; font-weight: 800; letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--sidebar-active-color, #c6ff00);
  margin-bottom: 6px;
}
.sb-brand {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 22px; font-weight: 800; letter-spacing: -0.03em;
  color: var(--sidebar-title-color, #f0f0f0);
  line-height: 1; margin-bottom: 4px;
}
.sb-subbrand {
  font-size: 9px; font-weight: 600; letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--sidebar-dim, rgba(255,255,255,0.3));
  margin-bottom: 14px;
}

/* icon button row */
.sb-icons {
  display: flex; gap: 6px; margin-top: 2px;
}
.sb-icon-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--sidebar-border, rgba(255,255,255,0.08));
  background: transparent;
  color: var(--sidebar-nav-color, rgba(255,255,255,0.4));
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}
.sb-icon-btn:hover {
  background: var(--sidebar-active-bg, rgba(255,255,255,0.08));
  color: var(--sidebar-active-color, #c6ff00);
  border-color: var(--sidebar-active-color, rgba(255,255,255,0.2));
}
/* Active icon: filled with the theme's dominant accent */
.sb-icon-btn.active {
  background: var(--sidebar-active-color, #c6ff00);
  color: var(--accent-fg, #000);
  border-color: var(--sidebar-active-color, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--sidebar-active-color, #c6ff00) 40%, transparent);
}
.sb-icon-btn svg { width: 14px; height: 14px; stroke-width: 1.8; }

/* ── Document section ────────────────────────────────────────────────────── */
.sb-section {
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--sidebar-border, rgba(255,255,255,0.06));
  flex-shrink: 0;
}
.sb-label {
  font-size: 8px; font-weight: 800; letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--sidebar-dim, rgba(255,255,255,0.3));
  margin-bottom: 8px;
}
.sb-doc-title {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 13px; font-weight: 700; letter-spacing: -0.02em;
  color: var(--sidebar-title-color, #f0f0f0);
  line-height: 1.3; margin-bottom: 4px;
}
.sb-doc-meta {
  font-size: 10px;
  color: var(--sidebar-dim, rgba(255,255,255,0.35));
  line-height: 1.4;
}

/* ── Theme selector ──────────────────────────────────────────────────────── */
.sb-theme {
  padding: 12px 18px 10px;
  border-bottom: 1px solid var(--sidebar-border, rgba(255,255,255,0.06));
  flex-shrink: 0;
}
.theme-select {
  width: 100%; padding: 7px 10px; border-radius: 8px;
  font-size: 11.5px; font-weight: 500;
  border: 1px solid var(--sidebar-border, rgba(255,255,255,0.12));
  background: var(--sidebar-input-bg, rgba(255,255,255,0.06));
  color: var(--sidebar-title-color, rgba(255,255,255,0.85));
  cursor: pointer; appearance: none; -webkit-appearance: none;
  font-family: 'Plus Jakarta Sans', sans-serif;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23888' d='M5 7L1 3h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
}

/* ── Navigation ──────────────────────────────────────────────────────────── */
.sidebar-nav {
  flex: 1; overflow-y: auto; padding: 10px 0 8px;
}
.sidebar-nav::-webkit-scrollbar { width: 2px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); }

.nav-link {
  display: block; padding: 5px 18px 5px 20px;
  font-size: 11.5px; font-weight: 400;
  color: var(--sidebar-nav-color, rgba(255,255,255,0.45));
  text-decoration: none; line-height: 1.4;
  border-left: 2px solid transparent;
  transition: all 0.1s;
}
.nav-link:hover {
  color: var(--sidebar-nav-hover, rgba(255,255,255,0.85));
  background: rgba(255,255,255,0.03);
}
.nav-link.active {
  color: var(--sidebar-active-color, #c6ff00);
  border-left-color: var(--sidebar-active-color, #c6ff00);
  background: var(--sidebar-active-bg, rgba(198,255,0,0.04));
  font-weight: 600;
}
.nav-h1 { font-size: 12px; font-weight: 600; padding-left: 20px; }
.nav-h2 { font-size: 11px; padding-left: 28px; }
.nav-h3 { font-size: 10.5px; padding-left: 36px; opacity: 0.75; }

/* ── Footer ──────────────────────────────────────────────────────────────── */
.sb-footer {
  padding: 12px 18px;
  border-top: 1px solid var(--sidebar-border, rgba(255,255,255,0.06));
  flex-shrink: 0;
}
.sb-progress-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.sb-progress-pct {
  font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
  color: var(--sidebar-dim, rgba(255,255,255,0.3));
}
.sb-progress-pct span { color: var(--sidebar-active-color, #c6ff00); }
.sb-progress-pages {
  font-size: 9px; color: var(--sidebar-dim, rgba(255,255,255,0.3));
}
.sb-progress-bar {
  height: 2px; background: rgba(255,255,255,0.08); border-radius: 1px; margin-bottom: 12px;
}
.sb-progress-fill {
  height: 100%; background: var(--sidebar-active-color, #c6ff00);
  border-radius: 1px; width: 0%; transition: width 0.3s;
}
.sb-footer-actions {
  display: flex; gap: 6px;
}
.btn-pdf {
  flex: 1; padding: 8px 0; border-radius: 8px;
  font-size: 11px; font-weight: 700;
  background: var(--sidebar-active-color, #c6ff00);
  color: var(--accent-fg, #000);
  border: none; cursor: pointer;
  transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 5px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  box-shadow: 0 2px 12px color-mix(in srgb, var(--sidebar-active-color, #c6ff00) 35%, transparent);
}
.btn-pdf:hover {
  opacity: 0.9;
  box-shadow: 0 4px 18px color-mix(in srgb, var(--sidebar-active-color, #c6ff00) 50%, transparent);
}
.btn-pdf svg { width: 13px; height: 13px; stroke-width: 2; }

/* ── Main content area ───────────────────────────────────────────────────── */
.main-content {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  background: var(--bg);
}
.main-content::-webkit-scrollbar { width: 6px; }
.main-content::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

/* Cover styles are defined in themes.ts BASE_CSS (single source of truth). */

/* ── Report body ──────────────────────────────────────────────────────────── */
.report-body {
  padding: 44px 52px 72px;
  max-width: 880px;
}

/* ── Print overrides ─────────────────────────────────────────────────────── */
@media print {
  @page { size: A4; margin: 14mm 12mm; }
  html, body { height: auto; overflow: visible; }
  .app-layout { display: block; height: auto; }
  .sidebar { display: none !important; }
  .main-content { height: auto; overflow: visible; }
  .cover { page-break-after: always; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .callout, .metric-card, .table-wrap { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .metric-card { break-inside: avoid; }
  h1, h2, h3 { break-after: avoid; }
  tr { break-inside: avoid; }
  .metrics-grid { grid-template-columns: repeat(4, 1fr); }
  body { font-size: 11.5px; }
}

/* ── Light-theme sidebar overrides ─────────────────────────────────────────
   Light themes use a dark sidebar for contrast. Dark sidebar background
   is derived from each theme's cover gradient base for visual continuity. */
html[data-theme="minimal"] .sidebar     { background: #0a1929 !important; } /* Harness   */
html[data-theme="harness-pro"] .sidebar { background: #042f2e !important; } /* Aurora    */
html[data-theme="kinetic"] .sidebar     { background: #1c1208 !important; } /* Sandstone */
html[data-theme="bluestone"] .sidebar   { background: #0a1429 !important; } /* Bluestone */
</style>
</head>
<body data-theme="${themeId}">
<script>document.body.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'harness');</script>

<div class="app-layout">
  <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
  <aside class="sidebar">

    <!-- Top: brand + icons -->
    <div class="sb-top">
      <div class="sb-index-label">Index</div>
      <div class="sb-brand">Harness</div>
      <div class="sb-subbrand">IaCM · BVR Report</div>
      <div class="sb-icons">
        <button class="sb-icon-btn active" title="Download PDF" onclick="window.print()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>
        </button>
        <button class="sb-icon-btn" title="Toggle sidebar" onclick="document.querySelector('.sidebar').style.display='none'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
        </button>
        <button class="sb-icon-btn" title="Jump to top" onclick="document.getElementById('main-content').scrollTo({top:0,behavior:'smooth'})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10l7-7 7 7M5 19l7-7 7 7"/></svg>
        </button>
      </div>
    </div>

    <!-- Document info -->
    <div class="sb-section">
      <div class="sb-label">Document</div>
      <div class="sb-doc-title">${fm.title ?? "IaCM Report"}</div>
      <div class="sb-doc-meta">${fm.customer ? fm.customer.replace("Account: ", "") + " &nbsp;·&nbsp; " : ""}${fm.date ?? ""}</div>
    </div>

    <!-- Theme selector -->
    <div class="sb-theme">
      <div class="sb-label">Theme</div>
      <select class="theme-select" onchange="switchTheme(this.value)">
        ${themeOptions}
      </select>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav" id="sidebar-nav">
      ${navItems || '<div style="padding:8px 18px;font-size:10px;opacity:0.35">No sections</div>'}
    </nav>

    <!-- Footer: progress + PDF -->
    <div class="sb-footer">
      <div class="sb-progress-row">
        <div class="sb-progress-pct"><span id="sb-pct">0%</span> read</div>
        <div class="sb-progress-pages" id="sb-pages">01 / ${Math.max(headings.length, 1)}</div>
      </div>
      <div class="sb-progress-bar"><div class="sb-progress-fill" id="sb-fill"></div></div>
      <div class="sb-footer-actions">
        <button class="btn-pdf" onclick="window.print()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>
          Download PDF
        </button>
      </div>
    </div>
  </aside>

  <!-- ── Main content ────────────────────────────────────────────────────── -->
  <main class="main-content" id="main-content">
    ${buildCoverHtml(fm)}

    <!-- Report body -->
    <div class="report-body" id="report-body">
      ${htmlBody}
    </div>
  </main>
</div>

<script>
  // ── Instant theme switcher (no page reload) ────────────────────────────
  // All theme variables are pre-loaded as :root[data-theme="X"] blocks,
  // so swapping the attribute on <html> + <body> updates colours instantly
  // and the CSS transitions in DYNAMIC_CSS handle the smooth interpolation.
  function switchTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    document.body.setAttribute('data-theme', themeId);
    const sel = document.querySelector('.theme-select');
    if (sel && sel.value !== themeId) sel.value = themeId;
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('theme', themeId);
      window.history.replaceState({}, '', u.toString());
    } catch (_) { /* ignore — older browsers */ }
  }

  // ── Scroll-triggered reveal ────────────────────────────────────────────
  // Adds .reveal to selected elements; an IntersectionObserver toggles the
  // .in class as they enter the viewport for a fade-in-up animation.
  const REVEAL_SELECTORS = [
    '.report-body figure',
    '.report-body .callout',
    '.report-body .metric-card',
    '.report-body h1',
    '.report-body h2',
    '.report-body .table-wrap',
  ];
  REVEAL_SELECTORS.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => el.classList.add('reveal'));
  });

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObs.unobserve(entry.target);
      }
    });
  }, {
    root: document.getElementById('main-content'),
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.05,
  });
  document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));

  // ── Animated number counters in inlined SVGs ───────────────────────────
  // Finds large numeric <text> nodes inside chart SVGs (e.g. "2,461",
  // "100%", "74/100") and tweens them from 0 to their final value when
  // they scroll into view. Uses easeOutCubic for a confident, never-bouncy
  // landing — appropriate for executive dashboards.
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCounter(el, finalText, duration) {
    const m = String(finalText).match(/^([\\d,]+(?:\\.\\d+)?)(.*)$/);
    if (!m) { el.textContent = finalText; return; }
    const numStr   = m[1];
    const suffix   = m[2] || '';
    const useComma = numStr.indexOf(',') !== -1;
    const decimals = (numStr.split('.')[1] || '').length;
    const target   = parseFloat(numStr.replace(/,/g, ''));
    if (!isFinite(target)) { el.textContent = finalText; return; }

    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const v = target * easeOutCubic(t);
      let formatted;
      if (decimals > 0) {
        formatted = v.toFixed(decimals);
      } else {
        formatted = String(Math.round(v));
      }
      if (useComma) {
        const n = parseFloat(formatted);
        formatted = n.toLocaleString('en-US', { maximumFractionDigits: decimals });
      }
      el.textContent = formatted + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else      el.textContent = finalText;
    }
    requestAnimationFrame(tick);
  }

  // Discover all big-number SVG text nodes once SVGs are inlined in the DOM.
  const counters = [];
  document.querySelectorAll('figure svg text').forEach((t) => {
    const fs = parseFloat(t.getAttribute('font-size') || '0');
    const txt = (t.textContent || '').trim();
    // Only animate font-size >= 18, that's purely numeric/percent (no letters
    // beyond %, /, .).  Skip "0" so we don't flicker.
    if (fs >= 18 && /^[\\d,]+(?:\\.\\d+)?(?:%|\\/[\\d,]+)?$/.test(txt) && txt !== '0') {
      t.dataset.final = txt;
      t.textContent   = '0' + (txt.match(/(?:%|\\/[\\d,]+)$/) ? txt.match(/(?:%|\\/[\\d,]+)$/)[0] : '');
      counters.push(t);
    }
  });

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const final = entry.target.dataset.final;
        if (final) animateCounter(entry.target, final, 1400);
        counterObs.unobserve(entry.target);
      }
    });
  }, {
    root: document.getElementById('main-content'),
    threshold: 0.35,
  });
  counters.forEach((c) => counterObs.observe(c));

  // ── Print-mode safety ──────────────────────────────────────────────────
  // Fast-forward all in-flight animations and reveals before the browser
  // generates the PDF so nothing is mid-animation in the printed output.
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('[data-final]').forEach((el) => {
      el.textContent = el.dataset.final;
    });
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  });

  // ── Scroll progress ────────────────────────────────────────────────────
  const mainEl = document.getElementById('main-content');
  const pctEl = document.getElementById('sb-pct');
  const fillEl = document.getElementById('sb-fill');
  const pagesEl = document.getElementById('sb-pages');

  mainEl && mainEl.addEventListener('scroll', () => {
    const scrollTop = mainEl.scrollTop;
    const scrollH = mainEl.scrollHeight - mainEl.clientHeight;
    const pct = scrollH > 0 ? Math.round((scrollTop / scrollH) * 100) : 0;
    if (pctEl) pctEl.textContent = pct + '%';
    if (fillEl) fillEl.style.width = pct + '%';
  });

  // ── Scroll spy — highlight active section in sidebar ───────────────────
  const navLinks = document.querySelectorAll('.nav-link');
  const headings = Array.from(document.querySelectorAll('.report-body h1, .report-body h2, .report-body h3'));
  let activeIdx = 0;

  const setActive = (id) => {
    navLinks.forEach(l => l.classList.remove('active'));
    const link = document.querySelector('.nav-link[data-id="' + id + '"]');
    if (link) {
      link.classList.add('active');
      link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      // Update section counter
      const idx = Array.from(navLinks).indexOf(link);
      if (pagesEl && idx >= 0) {
        pagesEl.textContent = String(idx + 1).padStart(2,'0') + ' / ' + String(navLinks.length).padStart(2,'0');
      }
    }
  };

  // IntersectionObserver for scroll spy
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActive(entry.target.id);
      }
    });
  }, {
    root: document.getElementById('main-content'),
    rootMargin: '-80px 0px -65% 0px',
    threshold: 0
  });

  headings.forEach(h => { if (h.id) observer.observe(h); });

  // Smooth scroll on nav click
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('data-id');
      const target = document.getElementById(id);
      if (target) {
        const main = document.getElementById('main-content');
        const offset = target.getBoundingClientRect().top + main.scrollTop - 24;
        main.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

  // Keyboard: Cmd+P = print
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      window.print();
    }
  });

  // Activate first section on load
  if (headings.length > 0 && headings[0].id) {
    setActive(headings[0].id);
  }
</script>
</body>
</html>`;
}

export function startReportServer(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    if (httpServer) {
      resolve(boundPort);
      return;
    }

    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const pathname = url.pathname;

      // GET /report/:id
      const reportMatch = pathname.match(/^\/report\/([^/]+)$/);
      if (reportMatch) {
        const id = reportMatch[1]!;
        const report = reports.get(id);
        if (!report) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Report not found");
          return;
        }
        const rawTheme = url.searchParams.get("theme") ?? report.defaultTheme;
        const theme = (THEME_IDS.includes(rawTheme as ThemeId) ? rawTheme : report.defaultTheme) as ThemeId;
        try {
          const html = buildPage(report, theme, id);
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(html);
        } catch (err) {
          log.error("Error rendering report", { id, error: String(err) });
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end(`Render error: ${(err as Error).message}`);
        }
        return;
      }

      // Static assets: /report/:id/assets/... or /report/:id/path/to/file
      const assetMatch = pathname.match(/^\/report\/([^/]+)\/(.+)$/);
      if (assetMatch) {
        const id = assetMatch[1]!;
        const assetPath = assetMatch[2]!;
        const report = reports.get(id);
        if (report) {
          const fullPath = join(dirname(report.markdownPath), assetPath);
          log.debug("Asset request", { assetPath, fullPath, exists: existsSync(fullPath) });
          if (existsSync(fullPath)) {
            const ext = extname(fullPath).toLowerCase();
            const mt = mimeType(ext);
            res.writeHead(200, {
              "Content-Type": mt,
              "Cache-Control": "no-cache",
              "Access-Control-Allow-Origin": "*",
            });
            res.end(readFileSync(fullPath));
            return;
          }
          log.warn("Asset not found", { fullPath });
        }
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Asset not found: " + assetPath);
        return;
      }

      // Index
      if (pathname === "/" || pathname === "") {
        const items = [...reports.entries()].map(([id, r]) =>
          `<li><a href="/report/${id}">${id}</a> — <small>${r.markdownPath}</small></li>`,
        ).join("\n");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px">
          <h2>IaCM Reports</h2><ul>${items || "<li>No reports registered.</li>"}</ul>
        </body></html>`);
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    });

    server.listen(port, "127.0.0.1", () => {
      httpServer = server;
      boundPort = (server.address() as { port: number }).port;
      log.info(`Report renderer listening on http://127.0.0.1:${boundPort}`);
      resolve(boundPort);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        server.listen(0, "127.0.0.1");
      } else {
        reject(err);
      }
    });
  });
}

export function stopReportServer(): void {
  if (httpServer) {
    httpServer.close();
    httpServer = null;
    boundPort = 0;
  }
}
