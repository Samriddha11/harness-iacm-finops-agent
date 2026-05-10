/**
 * Parse Harness IaCM UI URLs to extract identifiers (org, project, workspace, run, etc.).
 * Enables users to paste a Harness URL instead of manually specifying individual parameters.
 *
 * Example IaCM URLs:
 *   /ng/account/{accountId}/iacm/orgs/{org}/projects/{project}/workspaces/{workspace}
 *   /ng/account/{accountId}/iacm/orgs/{org}/projects/{project}/workspaces/{workspace}/runs/{runId}
 */

export interface ParsedHarnessUrl {
  account_id: string;
  org_id?: string;
  project_id?: string;
  module?: string;
  resource_type?: string;
  resource_id?: string;
  workspace_id?: string;
}

type ContextField = "resource_id" | "workspace_id";

const RESOURCE_SEGMENTS: Record<string, { type: string; contextField: ContextField }> = {
  workspaces:   { type: "workspace",      contextField: "resource_id" },
  runs:         { type: "workspace_run",   contextField: "resource_id" },
  resources:    { type: "workspace_resource", contextField: "workspace_id" },
  variables:    { type: "workspace_variable", contextField: "workspace_id" },
  state:        { type: "workspace_state",  contextField: "workspace_id" },
};

const STRUCTURAL = new Set([
  "ng", "all", "account", "module", "orgs", "projects", "organizations",
  "iacm",
]);

export function parseHarnessUrl(urlStr: string): ParsedHarnessUrl {
  const url = new URL(urlStr);
  const segments = url.pathname.split("/").filter(Boolean);

  const result: ParsedHarnessUrl = { account_id: "" };

  const accountIdx = segments.indexOf("account");
  if (accountIdx >= 0 && accountIdx + 1 < segments.length) {
    result.account_id = segments[accountIdx + 1]!;
  }

  // Detect iacm module
  if (segments.includes("iacm")) {
    result.module = "iacm";
  }

  const orgsIdx = segments.indexOf("orgs");
  if (orgsIdx >= 0 && orgsIdx + 1 < segments.length) {
    result.org_id = segments[orgsIdx + 1]!;
  }

  const projectsIdx = segments.indexOf("projects");
  if (projectsIdx >= 0 && projectsIdx + 1 < segments.length) {
    result.project_id = segments[projectsIdx + 1]!;
  }

  const matches: Array<{ type: string; contextField: ContextField; id?: string; raw: string }> = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    const def = RESOURCE_SEGMENTS[seg];
    if (!def) continue;

    const next = segments[i + 1];
    let id: string | undefined;
    if (next && !RESOURCE_SEGMENTS[next] && !STRUCTURAL.has(next)) {
      id = decodeURIComponent(next);
      i++;
    }

    matches.push({ type: def.type, contextField: def.contextField, id, raw: seg });
  }

  // Extract workspace_id from /workspaces/{id}/... pattern
  const workspaceMatchIdx = matches.findIndex((m) => m.type === "workspace");
  if (workspaceMatchIdx >= 0) {
    const wsMatch = matches[workspaceMatchIdx]!;
    if (wsMatch.id) {
      result.workspace_id = wsMatch.id;
    }
  }

  if (matches.length > 0) {
    const primary = matches[matches.length - 1]!;
    result.resource_type = primary.type;
    if (primary.id) {
      result.resource_id = primary.id;
      result[primary.contextField] = primary.id;
    }
    // For nested resources, workspace_id is the workspace match id
    if (workspaceMatchIdx >= 0 && primary.type !== "workspace") {
      const wsMatch = matches[workspaceMatchIdx]!;
      if (wsMatch.id) {
        result.workspace_id = wsMatch.id;
      }
    }
  }

  return result;
}

const MERGEABLE_FIELDS: (keyof ParsedHarnessUrl)[] = [
  "org_id",
  "project_id",
  "module",
  "resource_type",
  "resource_id",
  "workspace_id",
];

export function applyUrlDefaults(
  args: Record<string, unknown>,
  url?: unknown,
): Record<string, unknown> {
  if (!url || typeof url !== "string") return args;

  let parsed: ParsedHarnessUrl;
  try {
    parsed = parseHarnessUrl(url);
  } catch {
    return args;
  }

  const merged = { ...args };
  for (const field of MERGEABLE_FIELDS) {
    if ((merged[field] === undefined || merged[field] === "") && parsed[field] !== undefined) {
      merged[field] = parsed[field];
    }
  }

  return merged;
}
