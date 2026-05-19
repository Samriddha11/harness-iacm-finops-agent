import type { HarnessClient } from "../client/harness-client.js";
import { createLogger } from "./logger.js";

const log = createLogger("iacm-workspace-pagination");

/** Requested page size (server may ignore and return fewer). */
export const IACM_WORKSPACE_PAGE_SIZE = 100;

/**
 * Observed Harness IaCM API server-side cap per page.
 * Pagination must continue while a full cap-sized page is returned.
 */
export const IACM_WORKSPACE_SERVER_PAGE_CAP = 30;

/** Parse one page of workspace list response (bare array or wrapped). */
export function parseWorkspacePage(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.workspaces)) return r.workspaces;
  if (r.data && typeof r.data === "object" && !Array.isArray(r.data)) {
    const d = r.data as Record<string, unknown>;
    if (Array.isArray(d.workspaces)) return d.workspaces;
  }
  if (Array.isArray(r.data)) return r.data;
  return [];
}

/**
 * List every workspace in a project, paginating until the API returns a short page.
 * The IaCM API returns a bare JSON array with no total count — never trust page-1 length alone.
 */
export async function listAllWorkspacesInProject(
  client: HarnessClient,
  org: string,
  project: string,
  signal?: AbortSignal,
): Promise<unknown[]> {
  const out: unknown[] = [];
  let page = 1;

  while (true) {
    const raw = await client.request<unknown>({
      path: `/iacm/api/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(project)}/workspaces`,
      params: {
        accountIdentifier: client.account,
        routingId: client.account,
        page,
        pageSize: IACM_WORKSPACE_PAGE_SIZE,
      },
      signal,
    });

    const batch = parseWorkspacePage(raw);
    if (batch.length === 0) break;
    out.push(...batch);
    // API returns at most ~30 per page; do not compare to requested pageSize (100).
    if (batch.length < IACM_WORKSPACE_SERVER_PAGE_CAP) break;
    page++;
  }

  return out;
}

/** Count workspaces in one project (paginated). Returns -1 on API failure. */
export async function countWorkspacesInProject(
  client: HarnessClient,
  org: string,
  project: string,
  signal?: AbortSignal,
): Promise<number> {
  try {
    const workspaces = await listAllWorkspacesInProject(client, org, project, signal);
    return workspaces.length;
  } catch (err) {
    log.warn("workspace count failed", { org, project, error: String(err) });
    return -1;
  }
}

/**
 * Count all workspaces account-wide via GET /iacm/api/workspaces (paginated).
 * Returns undefined if the account endpoint is unavailable (404).
 */
export async function countAllWorkspacesAccountWide(
  client: HarnessClient,
  signal?: AbortSignal,
): Promise<number | undefined> {
  let page = 1;
  let total = 0;

  try {
    while (true) {
      const raw = await client.request<unknown>({
        path: "/iacm/api/workspaces",
        params: {
          accountIdentifier: client.account,
          routingId: client.account,
          page,
          pageSize: IACM_WORKSPACE_PAGE_SIZE,
        },
        signal,
      });

      const batch = parseWorkspacePage(raw);
      if (batch.length === 0) return total;
      total += batch.length;
      if (batch.length < IACM_WORKSPACE_SERVER_PAGE_CAP) return total;
      page++;
    }
  } catch (err) {
    log.debug("account-wide workspace list unavailable", { error: String(err) });
    return undefined;
  }
}
