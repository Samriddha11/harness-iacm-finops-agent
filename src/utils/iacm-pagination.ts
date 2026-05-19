/**
 * Shared pagination helpers for the Harness IaCM workspace listing endpoint.
 *
 * The IaCM workspace endpoint
 *   GET /iacm/api/orgs/{org}/projects/{project}/workspaces
 * has a known footgun: it caps each page at 30 items server-side regardless
 * of the requested `pageSize` parameter, and the response is a bare JSON
 * array with no `total` / `hasMore` field. Naive callers that fetch only
 * page 1 silently undercount any project with more than 30 workspaces.
 *
 * Use these helpers everywhere the codebase needs to walk a project's
 * workspaces. They paginate to exhaustion and emit a `countMethod` /
 * `capDetected` signal so consumers can reason about confidence.
 */

import type { HarnessClient } from "../client/harness-client.js";
import { createLogger } from "./logger.js";

const log = createLogger("iacm-pagination");

/**
 * Observed server-side cap on the IaCM workspace endpoint.
 * If a single page returns exactly this many items, we treat it as a
 * "likely capped" signal and continue paginating regardless of requested size.
 */
export const WORKSPACE_PAGE_CAP = 30;

/** Hard safety belt — a single project should never have more than this many pages. */
const MAX_PAGES = 500;

export type CountMethod =
  | "paginated-exhaustive"   // walked pages until empty page returned (authoritative)
  | "single-page"            // only fetched page 1 — likely undercount if cap was hit
  | "totalElements"          // server returned an authoritative total field
  | "unreachable";           // first request failed — count is undefined

export interface PaginatedListResult<T> {
  items: T[];
  pagesFetched: number;
  /** True if any page returned exactly `WORKSPACE_PAGE_CAP` items — server-cap suspected. */
  capDetected: boolean;
  /** True if the request failed before any page could be read. */
  unreachable: boolean;
  countMethod: CountMethod;
}

/**
 * List every workspace in a project by walking pages until an empty page
 * is returned. Returns the items plus a confidence signal.
 *
 * @param requestedPageSize — sent to the server. The server typically caps at 30
 *                            regardless, but we still ask for more so that any
 *                            future server-side change benefits us automatically.
 */
export async function listAllWorkspacesPaginated<T = Record<string, unknown>>(
  client: HarnessClient,
  org: string,
  project: string,
  signal: AbortSignal,
  options: { requestedPageSize?: number } = {},
): Promise<PaginatedListResult<T>> {
  const requestedPageSize = options.requestedPageSize ?? 100;
  const items: T[] = [];
  let pagesFetched = 0;
  let capDetected = false;
  let unreachable = false;

  let page = 1; // IaCM workspace API is 1-based

  while (true) {
    let pageItems: T[] = [];
    try {
      const raw = await client.request<unknown>({
        path: `/iacm/api/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(project)}/workspaces`,
        params: {
          accountIdentifier: client.account,
          routingId: client.account,
          page,
          pageSize: requestedPageSize,
        },
        signal,
      });

      if (Array.isArray(raw)) {
        pageItems = raw as T[];
      } else if (raw && typeof raw === "object") {
        const r = raw as Record<string, unknown>;
        for (const key of ["workspaces", "items", "content"]) {
          if (Array.isArray(r[key])) {
            pageItems = r[key] as T[];
            break;
          }
        }
      }
    } catch (err) {
      if (page === 1) {
        // First request failed — treat as unreachable, return empty result.
        log.warn("workspace list page 1 failed", { org, project, err: String(err) });
        unreachable = true;
        return { items, pagesFetched, capDetected, unreachable, countMethod: "unreachable" };
      }
      // A later page failed — assume end-of-stream rather than total failure.
      log.warn("workspace list intermediate page failed", { org, project, page, err: String(err) });
      break;
    }

    pagesFetched += 1;
    items.push(...pageItems);
    if (pageItems.length === WORKSPACE_PAGE_CAP) capDetected = true;

    // Empty page is the only reliable end-of-stream signal because the server
    // ignores requestedPageSize and silently caps at 30 items per page.
    if (pageItems.length === 0) break;
    page += 1;
    if (page > MAX_PAGES) {
      log.warn("workspace list safety cap hit", { org, project, page, total: items.length });
      break;
    }
  }

  return {
    items,
    pagesFetched,
    capDetected,
    unreachable,
    countMethod: "paginated-exhaustive",
  };
}

/**
 * Convenience wrapper: count-only variant of `listAllWorkspacesPaginated`.
 * Returns -1 when unreachable (matches the convention of the older scan tool
 * so existing call sites keep their semantics).
 */
export async function countAllWorkspacesPaginated(
  client: HarnessClient,
  org: string,
  project: string,
  signal: AbortSignal,
): Promise<{ count: number; capDetected: boolean; countMethod: CountMethod }> {
  const r = await listAllWorkspacesPaginated(client, org, project, signal);
  return {
    count: r.unreachable ? -1 : r.items.length,
    capDetected: r.capDetected,
    countMethod: r.countMethod,
  };
}
