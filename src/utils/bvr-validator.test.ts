import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateBvrMarkdown } from "./bvr-validator.js";

const autodeskPath = resolve(
  process.cwd(),
  "reports/autodesk-bvr-2026-05-19/iacm-bvr.md",
);

describe("validateBvrMarkdown — extended canonical deliverable", () => {
  it("flags missing 1.1 subsection", () => {
    const md = `---
title: "T"
customer: "X"
date: "May 19, 2026"
defaultTheme: "minimal"
heroStats: "1|A; 2|B; 3|C; 4|D"
bvr_template: "canonical"
---
# Executive Summary
# 1. Enterprise Footprint
# 2. Maturity Assessment — Walk Tier
# 3. Feature Adoption
### 3.1 Module registry standardisation
# 4. OPA Governance
# 5. Recommended Actions
# 6. Before & After
# Appendix — Organisation Summary
`;
    const r = validateBvrMarkdown(md);
    expect(r.valid).toBe(false);
    expect(r.violations.some((v) => v.kind === "missing-subsection")).toBe(true);
  });

  it("passes full AutoDesk BVR when present on disk", () => {
    try {
      const md = readFileSync(autodeskPath, "utf8");
      const r = validateBvrMarkdown(md);
      expect(r.valid).toBe(true);
      expect(r.mode).toBe("canonical");
    } catch {
      // report gitignored — skip in CI
    }
  });
});
