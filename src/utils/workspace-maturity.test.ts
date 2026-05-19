import { describe, expect, it } from "vitest";
import { scoreModuleRegistryMaturity } from "./workspace-module-registry.js";
import { scoreVersionSprawlMaturity } from "./workspace-version-sprawl.js";

describe("scoreVersionSprawlMaturity", () => {
  it("scores high when few version pins exist", () => {
    const r = scoreVersionSprawlMaturity({
      distinctExactVersions: 2,
      distinctMajorMinorLines: 2,
      dominantLinePct: 80,
      totalWorkspaces: 100,
    });
    expect(r.score).toBeGreaterThanOrEqual(8);
  });

  it("scores low when many version pins exist", () => {
    const r = scoreVersionSprawlMaturity({
      distinctExactVersions: 17,
      distinctMajorMinorLines: 10,
      dominantLinePct: 27,
      totalWorkspaces: 857,
    });
    expect(r.score).toBeLessThanOrEqual(2);
  });
});

describe("scoreModuleRegistryMaturity", () => {
  it("scores low when most workspaces have no registry", () => {
    const r = scoreModuleRegistryMaturity({
      harness_private: 10,
      other_private: 0,
      public_only: 0,
      none: 90,
      total: 100,
    });
    expect(r.score).toBeLessThanOrEqual(4);
  });

  it("scores high when private registry dominates", () => {
    const r = scoreModuleRegistryMaturity({
      harness_private: 70,
      other_private: 10,
      public_only: 10,
      none: 10,
      total: 100,
    });
    expect(r.score).toBeGreaterThanOrEqual(8);
  });
});
