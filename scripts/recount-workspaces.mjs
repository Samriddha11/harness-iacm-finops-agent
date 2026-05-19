#!/usr/bin/env node
/**
 * Standalone re-count script for the BVR.
 *
 * Reads cookie + account from ~/.cursor/mcp.json (the user-harness-iacm
 * server's env block), lists every IACM-enabled project, then paginates the
 * workspace list per project until exhausted — bypassing the page-1-only
 * undercount in the older harness_iacm_scan tool.
 *
 * Output: { totalWorkspaces, totalProjects, orgCount, orgs: [...] } JSON
 * to stdout, plus a per-project line to stderr for progress tracking.
 */

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";

const MCP_JSON = resolve(homedir(), ".cursor/mcp.json");
const BASE = "https://app.harness.io/gateway";
const PAGE_SIZE = 100;
const PROJECT_CONCURRENCY = 12;

function stripJsonComments(s) {
  return s.replace(/^\s*\/\/.*$/gm, "");
}

async function loadAuth() {
  const raw = await readFile(MCP_JSON, "utf8");
  const parsed = JSON.parse(stripJsonComments(raw));
  const env = parsed?.mcpServers?.["harness-iacm"]?.env ?? {};
  const cookie = env.HARNESS_HEADER_COOKIE;
  const account = env.HARNESS_ACCOUNT_ID;
  if (!cookie || !account) {
    throw new Error("Missing HARNESS_HEADER_COOKIE or HARNESS_ACCOUNT_ID in mcp.json");
  }
  return { cookie, account };
}

async function harnessFetch(path, params, auth) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: {
      Cookie: auth.cookie,
      "Harness-Account": auth.account,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${url.pathname} :: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function listAllIacmProjects(auth) {
  const all = [];
  let page = 0;
  while (true) {
    const data = await harnessFetch("/ng/api/projects", {
      accountIdentifier: auth.account,
      hasModule: "IACM",
      pageIndex: page,
      pageSize: 200,
    }, auth);
    const content = data?.data?.content ?? [];
    for (const item of content) {
      if (item?.project) all.push(item.project);
    }
    const totalPages = data?.data?.totalPages ?? 1;
    if (page + 1 >= totalPages || content.length === 0) break;
    page += 1;
  }
  return all;
}

async function countWorkspaces(org, project, auth) {
  let total = 0;
  let page = 1;
  while (true) {
    let body;
    try {
      body = await harnessFetch(
        `/iacm/api/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(project)}/workspaces`,
        {
          accountIdentifier: auth.account,
          routingId: auth.account,
          page,
          pageSize: PAGE_SIZE,
        },
        auth,
      );
    } catch (e) {
      if (page === 1) {
        if (process.env.DEBUG_RECOUNT) {
          process.stderr.write(`page1 fail ${org}/${project}: ${e?.message || e}\n`);
        }
        return -1;
      }
      break;
    }
    let pageItems = 0;
    if (Array.isArray(body)) pageItems = body.length;
    else if (body && typeof body === "object") {
      for (const key of ["workspaces", "items", "content"]) {
        if (Array.isArray(body[key])) { pageItems = body[key].length; break; }
      }
    }
    total += pageItems;
    // Server-side cap is 30 regardless of requested pageSize — we cannot
    // detect end-of-stream from page size alone. Keep paginating until we
    // receive an empty page.
    if (pageItems === 0) break;
    page += 1;
    if (page > 500) break;
  }
  return total;
}

async function main() {
  const auth = await loadAuth();
  process.stderr.write(`auth ok account=${auth.account}\n`);

  const projects = await listAllIacmProjects(auth);
  process.stderr.write(`found ${projects.length} IACM-enabled projects\n`);

  const results = [];
  let done = 0;
  for (let i = 0; i < projects.length; i += PROJECT_CONCURRENCY) {
    const batch = projects.slice(i, i + PROJECT_CONCURRENCY);
    const part = await Promise.all(
      batch.map(async (p) => {
        const org = p.orgIdentifier ?? "default";
        const id = p.identifier;
        const name = p.name ?? id;
        const ws = await countWorkspaces(org, id, auth);
        return { org, project: id, name, workspaces: ws };
      }),
    );
    results.push(...part);
    done += part.length;
    process.stderr.write(`scanned ${done}/${projects.length}\n`);
  }

  const byOrg = new Map();
  for (const r of results) {
    if (!byOrg.has(r.org)) byOrg.set(r.org, []);
    byOrg.get(r.org).push(r);
  }

  const orgs = [];
  let totalWorkspaces = 0;
  let unreachable = 0;
  for (const [org, rs] of byOrg) {
    const sum = rs.reduce((s, r) => s + (r.workspaces > 0 ? r.workspaces : 0), 0);
    const u = rs.filter((r) => r.workspaces === -1).length;
    unreachable += u;
    totalWorkspaces += sum;
    orgs.push({
      org,
      projectCount: rs.length,
      workspaceCount: sum,
      unreachableProjects: u,
      projects: rs.map((r) => ({ identifier: r.project, name: r.name, workspaces: r.workspaces })),
    });
  }
  orgs.sort((a, b) => b.workspaceCount - a.workspaceCount);

  const out = {
    summary: {
      totalProjects: projects.length,
      orgCount: orgs.length,
      totalWorkspaces,
      unreachableProjects: unreachable,
      scannedAt: new Date().toISOString(),
    },
    orgs,
  };
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write(`error: ${e?.message || e}\n`);
  process.exit(1);
});
