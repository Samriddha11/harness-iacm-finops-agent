/**
 * BVR canonical-structure validator.
 *
 * Every customer-facing IaCM Business Value Review must follow the same
 * top-level skeleton so reports stay recognisable across customers and
 * across agent sessions. Free-styling ("Path to RUN tier" instead of
 * "5. Recommended Actions", appended "Strategic narrative" sections,
 * split appendices, etc.) breaks recognition the moment two BVRs are
 * compared side-by-side.
 *
 * The renderer (and the PDF generator) call `validateBvrMarkdown()`
 * before producing output and refuse to render if the document deviates
 * from canonical structure — unless the author explicitly opts out via
 * frontmatter `bvr_template: "custom"`.
 *
 * The validator is intentionally strict on structure (sections, ordering,
 * frontmatter) and lenient on content (it never inspects narrative text,
 * never flags extra subsections under H2/H3, never enforces word counts).
 * Authors retain full editorial control inside each canonical section.
 */

/** Required H1 sections, in order. */
const REQUIRED_SECTIONS: Array<{
  id: string;
  matcher: RegExp;
  display: string;
  /** Optional: a section is allowed to be skipped if `bvr_template` is "custom" */
  skippableInCustom: boolean;
}> = [
  { id: "executive-summary",   matcher: /^Executive\s+Summary\b/i,                    display: "Executive Summary",                       skippableInCustom: true },
  { id: "enterprise-footprint", matcher: /^1\.\s*Enterprise\s+Footprint\b/i,           display: "1. Enterprise Footprint",                 skippableInCustom: true },
  { id: "maturity-assessment", matcher: /^2\.\s*Maturity\s+Assessment\b/i,            display: "2. Maturity Assessment — <tier> Tier",    skippableInCustom: true },
  { id: "feature-adoption",    matcher: /^3\.\s*Feature\s+Adoption\b/i,               display: "3. Feature Adoption",                     skippableInCustom: true },
  { id: "opa-governance",      matcher: /^4\.\s*OPA\s+Governance\b/i,                 display: "4. OPA Governance",                       skippableInCustom: true },
  { id: "recommended-actions", matcher: /^5\.\s*Recommended\s+Actions\b/i,            display: "5. Recommended Actions",                  skippableInCustom: true },
  { id: "before-and-after",    matcher: /^6\.\s*Before\s*(?:&|and)\s*After\b/i,       display: "6. Before & After",                       skippableInCustom: true },
  { id: "appendix",            matcher: /^Appendix\b/i,                                display: "Appendix — Organisation Summary",        skippableInCustom: true },
];

/** Frontmatter fields every BVR must declare. */
const REQUIRED_FRONTMATTER = ["title", "customer", "date", "defaultTheme", "heroStats"] as const;

/** The closed set of `:::` directive types the renderer recognises. */
const ALLOWED_DIRECTIVES = new Set(["success", "critical", "warning", "info", "action", "quote"]);

export type ViolationKind =
  | "missing-frontmatter"
  | "missing-frontmatter-field"
  | "missing-section"
  | "section-out-of-order"
  | "duplicate-section"
  | "unknown-directive"
  | "missing-subsection"
  | "missing-chart"
  | "missing-table";

/** H3 subsections every canonical customer BVR must include (Tu/Twilio deliverable). */
const REQUIRED_SUBSECTIONS: Array<{ id: string; matcher: RegExp; display: string }> = [
  { id: "workspace-status", matcher: /^#{1,3}\s*1\.1\s+Workspace\s+Status/i, display: "1.1 Workspace Status Distribution" },
  { id: "provisioner-sprawl", matcher: /^#{1,3}\s*1\.2\s+Provisioner/i, display: "1.2 Provisioner Type & Version Sprawl" },
  { id: "module-registry", matcher: /^#{1,3}\s*3\.1\s+Module\s+registry/i, display: "3.1 Module registry standardisation" },
];

/** Chart kinds required in every canonical BVR (inline ```chart <kind> fences). */
const REQUIRED_CHART_KINDS = [
  "scorecard",
  "org_footprint",
  "monthly_growth",
  "maturity_radar",
  "feature_gauges",
  "opa_donut",
  "priority_matrix",
] as const;

const MIN_BAR_CHARTS = 4;

export interface Violation {
  kind: ViolationKind;
  message: string;
  /** 1-based line number in the source where the issue was detected (when applicable). */
  line?: number;
  /** Suggested remediation, when available. */
  hint?: string;
}

export interface ValidationResult {
  valid: boolean;
  /** "canonical" enforces full skeleton. "custom" allows arbitrary structure but still validates frontmatter and directive vocabulary. */
  mode: "canonical" | "custom";
  violations: Violation[];
  /** Soft notices that don't block rendering but are surfaced to the agent. */
  warnings: string[];
  /** Echo of the H1 sections found, in order — useful for debugging. */
  detectedSections: string[];
}

/** Parse the YAML frontmatter block at the top of a markdown document. */
function parseFrontmatter(md: string): { fields: Record<string, string>; bodyStartLine: number; hasFrontmatter: boolean } {
  const lines = md.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    return { fields: {}, bodyStartLine: 1, hasFrontmatter: false };
  }
  const fields: Record<string, string> = {};
  let i = 1;
  for (; i < lines.length; i++) {
    if (lines[i]?.trim() === "---") {
      // body starts at i+1 (zero-indexed) → line i+2 in 1-based
      return { fields, bodyStartLine: i + 2, hasFrontmatter: true };
    }
    const m = lines[i]?.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*?)\s*$/);
    if (m) {
      // Strip surrounding quotes if present
      let v = m[2] ?? "";
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      fields[m[1]!] = v;
    }
  }
  // Frontmatter never closed
  return { fields, bodyStartLine: i + 1, hasFrontmatter: true };
}

/**
 * Validate a BVR markdown document against the canonical template.
 *
 * @param md - the full markdown source (frontmatter + body)
 * @returns A {@link ValidationResult} with mode, violations, and warnings.
 */
export function validateBvrMarkdown(md: string): ValidationResult {
  const violations: Violation[] = [];
  const warnings: string[] = [];

  // ── Frontmatter ─────────────────────────────────────────────────────────
  const { fields, hasFrontmatter } = parseFrontmatter(md);

  if (!hasFrontmatter) {
    violations.push({
      kind: "missing-frontmatter",
      line: 1,
      message: "BVR markdown must start with a YAML frontmatter block fenced by '---' lines.",
      hint: "See the iacm_bvr MCP prompt for the canonical frontmatter contract.",
    });
  }

  // Resolve the validation mode from frontmatter (default: canonical).
  const mode: "canonical" | "custom" = (fields.bvr_template?.toLowerCase() === "custom") ? "custom" : "canonical";

  for (const f of REQUIRED_FRONTMATTER) {
    if (!fields[f] || fields[f]!.trim() === "") {
      violations.push({
        kind: "missing-frontmatter-field",
        message: `Frontmatter is missing required field '${f}'.`,
        hint:
          f === "heroStats"
            ? "Format: '<value>|<label>; <value>|<label>; ...' — semicolons between stats, pipes between value and label."
            : f === "defaultTheme"
              ? "One of: minimal, harness-pro, kinetic, bluestone, dark, ocean, black-lime, carbon."
              : "See the iacm_bvr MCP prompt for examples.",
      });
    }
  }

  // ── Detect H1 sections ───────────────────────────────────────────────────
  const lines = md.split(/\r?\n/);
  const detected: Array<{ title: string; line: number }> = [];

  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i] ?? "";
    if (/^```/.test(ln)) inFence = !inFence;
    if (inFence) continue;
    const m = ln.match(/^#\s+(.+?)\s*$/);
    if (m) detected.push({ title: m[1]!, line: i + 1 });
  }

  // ── Section presence + ordering (canonical mode only) ───────────────────
  if (mode === "canonical") {
    let cursor = 0; // index into REQUIRED_SECTIONS
    const matched = new Map<string, number>(); // section id → first detected line
    const seenIds = new Set<string>();

    for (const d of detected) {
      const matchedReq = REQUIRED_SECTIONS.find((s) => s.matcher.test(d.title));
      if (!matchedReq) {
        // Extra H1 — warn but don't fail. Authors may legitimately add a top-level
        // section in canonical mode (e.g. "Glossary"). We surface it so the agent
        // can decide whether to keep it or fold the content elsewhere.
        warnings.push(`Extra top-level section detected at line ${d.line}: '${d.title}'. Canonical BVRs use only the documented section set; consider folding this into an existing section or move to the Appendix.`);
        continue;
      }
      if (seenIds.has(matchedReq.id)) {
        violations.push({
          kind: "duplicate-section",
          line: d.line,
          message: `Section '${matchedReq.display}' appears more than once.`,
          hint: "Each canonical section must occur exactly once.",
        });
        continue;
      }
      seenIds.add(matchedReq.id);
      matched.set(matchedReq.id, d.line);

      // Order check: the matched required-section index must be >= cursor
      const reqIndex = REQUIRED_SECTIONS.findIndex((s) => s.id === matchedReq.id);
      if (reqIndex < cursor) {
        violations.push({
          kind: "section-out-of-order",
          line: d.line,
          message: `Section '${matchedReq.display}' appears out of canonical order at line ${d.line}.`,
          hint: `Canonical order: ${REQUIRED_SECTIONS.map((s) => s.display).join(" → ")}.`,
        });
      } else {
        cursor = reqIndex + 1;
      }
    }

    // Missing required sections
    for (const req of REQUIRED_SECTIONS) {
      if (!matched.has(req.id)) {
        violations.push({
          kind: "missing-section",
          message: `Required canonical section '${req.display}' is missing.`,
          hint:
            "Either add the section to your BVR, or set frontmatter 'bvr_template: \"custom\"' if this is a deliberately non-canonical document.",
        });
      }
    }

    // ── Extended deliverable (subsections, charts, feature table) ─────────
    for (const sub of REQUIRED_SUBSECTIONS) {
      if (!lines.some((ln) => sub.matcher.test(ln))) {
        violations.push({
          kind: "missing-subsection",
          message: `Required subsection '${sub.display}' is missing.`,
          hint: "Invoke the iacm_bvr MCP prompt — every customer BVR uses the same Tu/Twilio-style subsections.",
        });
      }
    }

    const chartKinds: string[] = [];
    const chartRe = /^```chart\s+(\S+)/;
    for (const ln of lines) {
      const m = ln.match(chartRe);
      if (m) chartKinds.push(m[1]!.toLowerCase());
    }

    for (const kind of REQUIRED_CHART_KINDS) {
      if (!chartKinds.includes(kind)) {
        violations.push({
          kind: "missing-chart",
          message: `Required chart kind '${kind}' is missing (inline \`\`\`chart ${kind}\` fence).`,
          hint: "See iacm_bvr MCP prompt Step 2 for JSON data shapes.",
        });
      }
    }

    const barCount = chartKinds.filter((k) => k === "bar").length;
    if (barCount < MIN_BAR_CHARTS) {
      violations.push({
        kind: "missing-chart",
        message: `Canonical BVR requires at least ${MIN_BAR_CHARTS} bar charts (found ${barCount}).`,
        hint:
          "Include: Top 10 Projects, Workspace Status, Provisioner Type, Version Lines, Module registry (see iacm_bvr §1 and §3.1).",
      });
    }

    const hasFeatureTable = lines.some((ln) => /\|\s*Feature\s*\|\s*Adoption\s*\|\s*Note\s*\|/i.test(ln));
    if (!hasFeatureTable) {
      violations.push({
        kind: "missing-table",
        message: "Feature Adoption section is missing the '| Feature | Adoption | Note |' table.",
        hint: "Populate from harness_iacm_feature_scan and harness_iacm_workspace_inventory.",
      });
    }
  }

  // ── Directive vocabulary (both modes) ───────────────────────────────────
  // Match opening fences `::: <name>` (the renderer ignores closing `:::` lines).
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i]?.match(/^::: \s*([A-Za-z][A-Za-z0-9_-]*)\s*$/);
    if (!m) continue;
    const name = m[1]!.toLowerCase();
    if (!ALLOWED_DIRECTIVES.has(name)) {
      violations.push({
        kind: "unknown-directive",
        line: i + 1,
        message: `Unknown ':::' directive '${name}' at line ${i + 1}.`,
        hint: `Allowed: ${Array.from(ALLOWED_DIRECTIVES).join(", ")}.`,
      });
    }
  }

  return {
    valid: violations.length === 0,
    mode,
    violations,
    warnings,
    detectedSections: detected.map((d) => d.title),
  };
}

/**
 * Format a {@link ValidationResult} as a human-readable error block, suitable
 * for returning to an MCP tool caller. Used by the renderer's hard gate.
 */
export function formatViolations(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) return "";
  const lines: string[] = [];
  if (!result.valid) {
    lines.push(`BVR markdown does not match the canonical structure (mode: ${result.mode}). ` +
      `${result.violations.length} violation${result.violations.length === 1 ? "" : "s"}:`);
    for (const v of result.violations) {
      const where = v.line ? ` (line ${v.line})` : "";
      lines.push(`  • ${v.message}${where}${v.hint ? ` — ${v.hint}` : ""}`);
    }
  }
  if (result.warnings.length > 0) {
    lines.push(`${result.warnings.length} warning${result.warnings.length === 1 ? "" : "s"}:`);
    for (const w of result.warnings) lines.push(`  • ${w}`);
  }
  if (!result.valid) {
    lines.push("");
    lines.push("To fix:");
    lines.push("  1. Invoke the 'iacm_bvr' MCP prompt for the canonical recipe and rewrite the document, OR");
    lines.push("  2. If the document is intentionally non-canonical (e.g. a custom analysis), set frontmatter 'bvr_template: \"custom\"' to disable structural enforcement (frontmatter and directive vocabulary remain enforced).");
  }
  return lines.join("\n");
}
