import { describe, expect, it } from "vitest";
import {
  IACM_WORKSPACE_SERVER_PAGE_CAP,
  parseWorkspacePage,
} from "./iacm-workspace-pagination.js";

describe("parseWorkspacePage", () => {
  it("parses bare array responses", () => {
    const items = [{ identifier: "a" }, { identifier: "b" }];
    expect(parseWorkspacePage(items)).toEqual(items);
  });

  it("parses wrapped workspaces array", () => {
    const items = [{ identifier: "x" }];
    expect(parseWorkspacePage({ workspaces: items, pagination: { total_items: 99 } })).toEqual(items);
  });

  it("documents the observed server page cap", () => {
    expect(IACM_WORKSPACE_SERVER_PAGE_CAP).toBe(30);
  });
});
