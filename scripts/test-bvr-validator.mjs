#!/usr/bin/env node
/**
 * Smoke test for the BVR canonical-structure validator.
 *
 * Runs three cases:
 *   1. The current Twilio BVR — should validate cleanly (canonical).
 *   2. A deliberately-broken document with multiple violations — should
 *      surface every violation with line numbers and hints.
 *   3. A "custom" document that opts out via frontmatter — should pass
 *      structural checks while still enforcing frontmatter + directives.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateBvrMarkdown, formatViolations } from "../build/utils/bvr-validator.js";

const tmp = tmpdir();

function run(name, md) {
  console.log(`\n${"=".repeat(72)}\n${name}\n${"=".repeat(72)}`);
  const result = validateBvrMarkdown(md);
  console.log(`valid=${result.valid}  mode=${result.mode}  ` +
              `violations=${result.violations.length}  warnings=${result.warnings.length}`);
  console.log(`detected sections: ${JSON.stringify(result.detectedSections)}`);
  if (!result.valid || result.warnings.length > 0) {
    console.log("\n" + formatViolations(result));
  }
}

// ── Case 1: real Twilio BVR ────────────────────────────────────────────────
const twilioPath = "/Users/samriddha/Harness-MCP-Servers/iacm2/harness-iacm-finops-agent/reports/twilio-bvr-2026-05-19/iacm-bvr.md";
try {
  run("Case 1 — current Twilio BVR (canonical structure expected)",
      readFileSync(twilioPath, "utf8"));
} catch (e) {
  console.log(`(Twilio BVR not on disk: ${e?.message || e})`);
}

// ── Case 2: deliberately broken document ───────────────────────────────────
const broken = `---
title: "Some Report"
date: "May 19, 2026"
---

# Path to RUN tier

This is what an agent might invent instead of "5. Recommended Actions".

# Where Twilio stands on the maturity curve

Made-up section name.

::: enthusiasm
This is not a recognised directive type.
:::

# 4. OPA Governance

Wrong order — should be after Feature Adoption.

# 1. Enterprise Footprint

Wrong order again.
`;
run("Case 2 — deliberately broken (missing exec summary, fake sections, " +
    "out-of-order, unknown directive, missing frontmatter fields)", broken);

// ── Case 3: explicit opt-out via bvr_template: "custom" ────────────────────
const custom = `---
title: "IaCM Internal Note"
customer: "Internal"
date: "May 19, 2026"
defaultTheme: "minimal"
heroStats: "1|Internal use; no customer cover"
bvr_template: "custom"
---

# Topic 1

Free-form structure permitted.

# Topic 2

::: success
Allowed directive.
:::

# Topic 3

::: enthusiasm
Still flagged because directive vocabulary is enforced in custom mode too.
:::
`;
run("Case 3 — bvr_template: \"custom\" opt-out (sections free, " +
    "directives still enforced)", custom);

// ── Case 4: canonical with extra section (warning, not violation) ──────────
const withExtra = readFileSync(twilioPath, "utf8") +
  "\n\n# Glossary\n\nThis is an extra section the user explicitly asked for.\n";
run("Case 4 — canonical with extra Glossary section (should warn, not fail)",
    withExtra);

console.log("\n" + "=".repeat(72));
console.log("Smoke test complete.");
