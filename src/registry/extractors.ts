/**
 * Response extractors for Harness IaCM API responses.
 *
 * The IaCM API returns data in different shapes depending on version and endpoint.
 * All extractors try multiple field names / nesting levels defensively.
 */

/** Try multiple page-count field paths across Harness response shapes. */
function resolveTotal(r: Record<string, unknown>, items: unknown[]): number {
  // IaCM pagination wrapper: { pagination: { total_items, totalItems } }
  const pag = r.pagination as Record<string, unknown> | undefined;
  if (typeof pag?.total_items === "number") return pag.total_items;
  if (typeof pag?.totalItems === "number") return pag.totalItems;
  if (typeof pag?.total === "number") return pag.total;
  // NG API: top-level totalElements / total
  if (typeof r.totalElements === "number") return r.totalElements;
  if (typeof r.total === "number") return r.total;
  // Fall back to current page length (only accurate on first page)
  return items.length;
}

/**
 * Universal workspace-list extractor.
 *
 * The Harness IaCM API returns workspaces as a bare JSON array — no wrapper,
 * no pagination block. We also handle wrapped shapes defensively.
 *
 * Tries (in order):
 *   1. bare array [...]                                  — IACM API (confirmed)
 *   2. { workspaces: [...], pagination: {...} }          — possible future shape
 *   3. { data: { workspaces: [...] } }                   — wrapped IACM
 *   4. { data: { content: [...], totalElements: N } }    — NG API convention
 *   5. { content: [...] } / { items: [...] }             — generic list shapes
 */
export const workspaceListExtract = (raw: unknown): { items: unknown[]; total: number } => {
  // Bare array — confirmed IACM API shape
  if (Array.isArray(raw)) return { items: raw, total: raw.length };
  if (!raw || typeof raw !== "object") return { items: [], total: 0 };

  const r = raw as Record<string, unknown>;

  // 1. Direct IACM shape
  if (Array.isArray(r.workspaces)) {
    return { items: r.workspaces, total: resolveTotal(r, r.workspaces) };
  }

  // 2. Wrapped in data
  if (r.data && typeof r.data === "object" && !Array.isArray(r.data)) {
    const d = r.data as Record<string, unknown>;
    if (Array.isArray(d.workspaces)) {
      return { items: d.workspaces, total: resolveTotal(d, d.workspaces) };
    }
    if (Array.isArray(d.content)) {
      return { items: d.content, total: resolveTotal(d, d.content) };
    }
    if (Array.isArray(d)) {
      return { items: d as unknown[], total: (d as unknown[]).length };
    }
  }

  // 3. Bare data array
  if (Array.isArray(r.data)) {
    return { items: r.data, total: resolveTotal(r, r.data) };
  }

  // 4. Generic fallback keys
  for (const key of ["content", "items", "results", "list"]) {
    if (Array.isArray(r[key])) {
      const arr = r[key] as unknown[];
      return { items: arr, total: resolveTotal(r, arr) };
    }
  }

  return { items: [], total: 0 };
};

/**
 * Universal workspace-get extractor.
 * Tries { workspace: {...} }, { data: { workspace: {...} } }, { data: {...} }, raw.
 */
export const workspaceGetExtract = (raw: unknown): unknown => {
  if (!raw || typeof raw !== "object") return raw;
  const r = raw as Record<string, unknown>;
  if (r.workspace) return r.workspace;
  if (r.data && typeof r.data === "object" && !Array.isArray(r.data)) {
    const d = r.data as Record<string, unknown>;
    if (d.workspace) return d.workspace;
    return d;
  }
  return raw;
};

/**
 * Universal run-list extractor.
 * Tries { runs: [...] }, { data: { runs: [...] } }, { data: [...] }, generic keys.
 */
export const runListExtract = (raw: unknown): { items: unknown[]; total: number } => {
  if (Array.isArray(raw)) return { items: raw, total: raw.length };
  if (!raw || typeof raw !== "object") return { items: [], total: 0 };

  const r = raw as Record<string, unknown>;

  if (Array.isArray(r.runs)) {
    return { items: r.runs, total: resolveTotal(r, r.runs) };
  }
  if (r.data && typeof r.data === "object" && !Array.isArray(r.data)) {
    const d = r.data as Record<string, unknown>;
    if (Array.isArray(d.runs)) return { items: d.runs, total: resolveTotal(d, d.runs) };
    if (Array.isArray(d.content)) return { items: d.content, total: resolveTotal(d, d.content) };
  }
  if (Array.isArray(r.data)) return { items: r.data, total: resolveTotal(r, r.data) };

  for (const key of ["content", "items", "results"]) {
    if (Array.isArray(r[key])) {
      const arr = r[key] as unknown[];
      return { items: arr, total: resolveTotal(r, arr) };
    }
  }
  return { items: [], total: 0 };
};

export const runGetExtract = (raw: unknown): unknown => {
  if (!raw || typeof raw !== "object") return raw;
  const r = raw as Record<string, unknown>;
  if (r.run) return r.run;
  if (r.data && typeof r.data === "object" && !Array.isArray(r.data)) {
    const d = r.data as Record<string, unknown>;
    return d.run ?? d;
  }
  return raw;
};

export const resourceListExtract = (raw: unknown): { items: unknown[]; total: number } => {
  if (Array.isArray(raw)) return { items: raw, total: raw.length };
  if (!raw || typeof raw !== "object") return { items: [], total: 0 };
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.resources)) return { items: r.resources, total: resolveTotal(r, r.resources) };
  if (r.data && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    if (Array.isArray(d.resources)) return { items: d.resources, total: resolveTotal(d, d.resources) };
    if (Array.isArray(d.content)) return { items: d.content, total: resolveTotal(d, d.content) };
  }
  for (const key of ["content", "items", "results"]) {
    if (Array.isArray(r[key])) {
      const arr = r[key] as unknown[];
      return { items: arr, total: resolveTotal(r, arr) };
    }
  }
  return { items: [], total: 0 };
};

export const variableListExtract = (raw: unknown): { items: unknown[]; total: number } => {
  if (Array.isArray(raw)) return { items: raw, total: raw.length };
  if (!raw || typeof raw !== "object") return { items: [], total: 0 };
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.variables)) return { items: r.variables, total: resolveTotal(r, r.variables) };
  if (r.data && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    if (Array.isArray(d.variables)) return { items: d.variables, total: resolveTotal(d, d.variables) };
    if (Array.isArray(d.content)) return { items: d.content, total: resolveTotal(d, d.content) };
  }
  for (const key of ["content", "items", "results"]) {
    if (Array.isArray(r[key])) {
      const arr = r[key] as unknown[];
      return { items: arr, total: resolveTotal(r, arr) };
    }
  }
  return { items: [], total: 0 };
};

export const stateExtract = (raw: unknown): unknown => raw;
