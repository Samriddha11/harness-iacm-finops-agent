/**
 * Aggregate workspace provisioner/version sprawl, status, and module registry
 * from IaCM workspace list/detail payloads (shared by BVR tools).
 */

import {
  bumpRegistryCount,
  classifyModuleRegistry,
  emptyRegistryCounts,
  scoreModuleRegistryMaturity,
  type ModuleRegistryCounts,
} from "./workspace-module-registry.js";
import { scoreVersionSprawlMaturity } from "./workspace-version-sprawl.js";

export function normProvisioner(p: unknown): string {
  const s = String(p ?? "terraform").toLowerCase().trim();
  if (s.includes("tofu") || s === "opentofu") return "opentofu";
  if (s.includes("terragrunt")) return "terragrunt";
  if (s.includes("terraform") || s === "tf") return "terraform";
  return s || "unknown";
}

export function normVersion(v: unknown): string {
  const s = String(v ?? "").trim();
  return s || "(unset)";
}

/** Major.minor label for semver pins. */
export function versionLabel(provisioner: string, version: string): string {
  const v = normVersion(version);
  if (/^latest$/i.test(v)) return `${provisioner} · latest (floating)`;
  const semver = v.match(/^(\d+)\.(\d+)/);
  if (semver) return `${provisioner} ${semver[1]}.${semver[2]}.x`;
  return `${provisioner} ${v}`;
}

function bump(map: Map<string, number>, key: string, n = 1): void {
  map.set(key, (map.get(key) ?? 0) + n);
}

function toSortedRecords(map: Map<string, number>): Array<{ key: string; count: number }> {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export function normStatus(s: unknown): string {
  const v = String(s ?? "unknown").toLowerCase().trim();
  return v || "unknown";
}

export interface WorkspaceInventoryAggregate {
  totalWorkspaces: number;
  provisioners: Array<{ provisioner: string; count: number; pct: number }>;
  provisionerVersions: Array<{ provisioner: string; version: string; count: number; pct: number }>;
  versionLabels: Array<{ label: string; count: number; pct: number }>;
  statuses: Array<{ status: string; count: number; pct: number }>;
  moduleRegistry: ModuleRegistryCounts & {
    harness_private_pct: number;
    other_private_pct: number;
    public_only_pct: number;
    none_pct: number;
  };
  versionSprawl: {
    distinctExactVersions: number;
    distinctMajorMinorLines: number;
    dominantLinePct: number;
    maturityScore: number;
    maxScore: number;
    finding: string;
    recommendation: string;
  };
  moduleRegistryMaturity: {
    maturityScore: number;
    maxScore: number;
    finding: string;
    recommendation: string;
  };
}

export function aggregateWorkspaceInventory(
  workspaces: Array<Record<string, unknown>>,
): WorkspaceInventoryAggregate {
  const byProvisioner = new Map<string, number>();
  const byProvisionerVersion = new Map<string, number>();
  const byVersionLabel = new Map<string, number>();
  const byStatus = new Map<string, number>();
  const moduleRegistry = emptyRegistryCounts();

  for (const ws of workspaces) {
    const provisioner = normProvisioner(ws.provisioner);
    const version = normVersion(ws.provisioner_version);
    const status = normStatus(ws.status);
    bump(byProvisioner, provisioner);
    bump(byProvisionerVersion, `${provisioner} @ ${version}`);
    bump(byVersionLabel, versionLabel(provisioner, version));
    bump(byStatus, status);
    bumpRegistryCount(moduleRegistry, classifyModuleRegistry(ws));
  }

  const total = workspaces.length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  const versionLabelsSorted = toSortedRecords(byVersionLabel).map(({ key, count }) => ({
    label: key,
    count,
    pct: pct(count),
  }));
  const distinctExact = toSortedRecords(byProvisionerVersion).length;
  const dominantLinePct =
    total > 0 && versionLabelsSorted.length > 0
      ? Math.round((versionLabelsSorted[0]!.count / total) * 100)
      : 0;

  const versionSprawl = scoreVersionSprawlMaturity({
    distinctExactVersions: distinctExact,
    distinctMajorMinorLines: versionLabelsSorted.length,
    dominantLinePct,
    totalWorkspaces: total,
  });
  const registryMaturity = scoreModuleRegistryMaturity(moduleRegistry);

  return {
    totalWorkspaces: total,
    provisioners: toSortedRecords(byProvisioner).map(({ key, count }) => ({
      provisioner: key,
      count,
      pct: pct(count),
    })),
    provisionerVersions: toSortedRecords(byProvisionerVersion).map(({ key, count }) => {
      const [provisioner, version] = key.split(" @ ");
      return { provisioner: provisioner ?? key, version: version ?? "", count, pct: pct(count) };
    }),
    versionLabels: versionLabelsSorted,
    statuses: toSortedRecords(byStatus).map(({ key, count }) => ({
      status: key,
      count,
      pct: pct(count),
    })),
    moduleRegistry: {
      ...moduleRegistry,
      harness_private_pct: pct(moduleRegistry.harness_private),
      other_private_pct: pct(moduleRegistry.other_private),
      public_only_pct: pct(moduleRegistry.public_only),
      none_pct: pct(moduleRegistry.none),
    },
    versionSprawl: {
      distinctExactVersions: distinctExact,
      distinctMajorMinorLines: versionLabelsSorted.length,
      dominantLinePct,
      maturityScore: versionSprawl.score,
      maxScore: 10,
      finding: versionSprawl.finding,
      recommendation: versionSprawl.recommendation,
    },
    moduleRegistryMaturity: {
      maturityScore: registryMaturity.score,
      maxScore: 10,
      finding: registryMaturity.finding,
      recommendation: registryMaturity.recommendation,
    },
  };
}
