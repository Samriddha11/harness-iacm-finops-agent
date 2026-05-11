/**
 * Shared chart palette + helpers.
 *
 * All hex codes used by the generators are deliberately constrained to the
 * set that themes.ts maps via CSS attribute selectors. This makes every
 * generated SVG auto-recolor on every theme without per-chart overrides.
 *
 * If you need to introduce a new colour, also add a recoloring rule in
 * themes.ts so the chart adapts to all themes.
 */
export const PALETTE = {
  // Surfaces (recolored to --svg-surface / --svg-card per theme)
  surface:   "#ffffff",
  card:      "#f8fafc",

  // Text (recolored to --chart-text / --chart-muted per theme)
  text:      "#1e293b",
  textDeep:  "#0d1f35",
  muted:     "#64748b",

  // Grid + neutral (recolored to --chart-grid / --chart-neutral)
  grid:      "#e2e8f0",
  neutral:   "#94a3b8",

  // White text inside coloured pills (auto-inverts via --svg-surface)
  white:     "#ffffff",

  // Theme-tracking series colours (recolored to --chart-1 .. --chart-5)
  primary:   "#0278D5",  // → --chart-1   (theme primary)
  sky:       "#38bdf8",  // → --chart-2
  secondary: "#0891b2",  // → --chart-3
  tertiary:  "#7c3aed",  // → --chart-4
  quaternary:"#4f46e5",  // → --chart-5

  // Semantic — always read as success/warning/danger/info on every theme
  success:   "#059669",  // → --chart-success
  warning:   "#d97706",  // → --chart-warning
  danger:    "#dc2626",  // → --chart-danger
  info:      "#1e40af",  // → --info  (cool blue on every theme)
} as const;

export const FONT_FAMILY = "Plus Jakarta Sans,Inter,sans-serif";

/** Word-wrap a string into lines no longer than `maxChars` characters. */
export function wrap(text: string, maxChars: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}

/** Approximate the rendered width of a sans-serif text label. */
export function approxW(text: string, fontSize: number, letterSpacingEm = 0): number {
  const charW   = fontSize * 0.58;
  const spacing = fontSize * letterSpacingEm;
  return text.length * charW + Math.max(0, text.length - 1) * spacing;
}

/** Escape XML-significant characters for safe embedding in SVG text content. */
export function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
