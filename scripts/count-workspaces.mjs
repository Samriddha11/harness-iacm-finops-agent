/**
 * One-off: count IaCM workspaces with correct pagination (matches Executive Dashboard).
 * Usage: node --env-file-if-exists=.env scripts/count-workspaces.mjs
 */
import { loadGlobalConfig, buildSessionConfig } from "../build/config.js";
import { HarnessClient } from "../build/client/harness-client.js";
import {
  countAllWorkspacesAccountWide,
  countWorkspacesInProject,
} from "../build/utils/iacm-workspace-pagination.js";

async function fetchAllIacmProjects(client) {
  const all = [];
  let page = 0;
  while (true) {
    const raw = await client.request({
      path: "/ng/api/projects",
      params: {
        accountIdentifier: client.account,
        hasModule: "IACM",
        pageIndex: page,
        pageSize: 200,
      },
    });
    const content = raw.data?.content ?? [];
    const projects = content.map((c) => c.project).filter(Boolean);
    all.push(...projects);
    const totalPages = raw.data?.totalPages ?? 1;
    if (page + 1 >= totalPages || projects.length === 0) break;
    page++;
  }
  return all;
}

const config = buildSessionConfig(loadGlobalConfig(), {});
const client = new HarnessClient(config);

console.log("Account:", client.account);
console.log("Trying account-wide /iacm/api/workspaces ...");
const accountWide = await countAllWorkspacesAccountWide(client);
if (accountWide !== undefined) {
  console.log("Account-wide workspace count:", accountWide);
  process.exit(0);
}

console.log("Account-wide endpoint unavailable — summing per-project (paginated) ...");
const projects = await fetchAllIacmProjects(client);
console.log("IACM projects:", projects.length);

let total = 0;
let i = 0;
for (const p of projects) {
  const org = p.orgIdentifier ?? "default";
  const n = await countWorkspacesInProject(client, org, p.identifier);
  if (n > 0) total += n;
  i++;
  if (i % 25 === 0) console.log(`  ... ${i}/${projects.length} projects, running total: ${total}`);
}

console.log("Per-project paginated total:", total);
