/**
 * Classify IaCM workspace module consumption by registry type (for BVR / maturity).
 */

export type ModuleRegistryKind =
  | "harness_private"
  | "other_private"
  | "public_only"
  | "none";

export interface ModuleRegistryCounts {
  harness_private: number;
  other_private: number;
  public_only: number;
  none: number;
  total: number;
}

function modulesJsonText(workspace: Record<string, unknown>): string {
  const raw = workspace.modules_json;
  if (raw == null || raw === "null" || raw === "") return "";
  return typeof raw === "string" ? raw : JSON.stringify(raw);
}

function envText(workspace: Record<string, unknown>): string {
  const env = workspace.environment_variables;
  if (!env) return "";
  return typeof env === "string" ? env : JSON.stringify(env);
}

function tfVarText(workspace: Record<string, unknown>): string {
  const v = workspace.terraform_variables;
  if (!v) return "";
  return typeof v === "string" ? v : JSON.stringify(v);
}

/** Classify how a workspace sources Terraform/OpenTofu modules. */
export function classifyModuleRegistry(workspace: Record<string, unknown>): ModuleRegistryKind {
  const modules = modulesJsonText(workspace).toLowerCase();
  const env = envText(workspace).toLowerCase();
  const tfVars = tfVarText(workspace).toLowerCase();
  const combined = `${modules} ${env} ${tfVars}`;

  const hasHarnessRegistry =
    combined.includes("harness.io") ||
    combined.includes("app.harness.io") ||
    combined.includes("harness_registry") ||
    combined.includes("harness-module") ||
    combined.includes("harness_module");

  const hasOtherPrivate =
    combined.includes("app.terraform.io") ||
    combined.includes("terraform.enterprise") ||
    combined.includes("terraform.cloud") ||
    combined.includes("artifactory") ||
    combined.includes("jfrog") ||
    combined.includes("tfe_token") ||
    combined.includes("tfc_token") ||
    combined.includes("terraform_enterprise") ||
    combined.includes("terraform_cloud_token") ||
    (combined.includes(".git::") || combined.includes("git@")) && modules.length > 0;

  const hasPublicRegistry =
    combined.includes("registry.terraform.io") ||
    combined.includes("registry.opentofu.org") ||
    combined.includes("hashicorp/") ||
    combined.includes("terraform-aws-modules");

  const hasModuleBlob =
    modules.length > 0 &&
    modules !== "null" &&
    !/^[0-9a-f-]{36}$/i.test(modules.trim());

  if (hasHarnessRegistry) return "harness_private";
  if (hasOtherPrivate) return "other_private";
  if (hasPublicRegistry || hasModuleBlob) return "public_only";

  // Git-sourced / unset — no private or public registry metadata (standardisation gap)
  return "none";
}

/** True when workspace uses any private registry (Harness or third-party). */
export function usesPrivateModuleRegistry(workspace: Record<string, unknown>): boolean {
  const k = classifyModuleRegistry(workspace);
  return k === "harness_private" || k === "other_private";
}

export function emptyRegistryCounts(): ModuleRegistryCounts {
  return { harness_private: 0, other_private: 0, public_only: 0, none: 0, total: 0 };
}

export function bumpRegistryCount(counts: ModuleRegistryCounts, kind: ModuleRegistryKind): void {
  counts[kind]++;
  counts.total++;
}

/** Maturity dimension score (0–10): rewards private registries, penalises no registry. */
export function scoreModuleRegistryMaturity(counts: ModuleRegistryCounts): {
  score: number;
  finding: string;
  recommendation: string;
} {
  const maxScore = 10;
  const { total } = counts;
  if (total === 0) {
    return {
      score: 0,
      finding: "No workspaces to evaluate for module registry usage.",
      recommendation: "Create IaCM workspaces and connect a Harness or enterprise module registry.",
    };
  }

  const privateCount = counts.harness_private + counts.other_private;
  const privatePct = Math.round((privateCount / total) * 100);
  const nonePct = Math.round((counts.none / total) * 100);
  const harnessPct = Math.round((counts.harness_private / total) * 100);

  let score: number;
  if (privatePct >= 60) score = 10;
  else if (privatePct >= 40) score = 8;
  else if (privatePct >= 20) score = 6;
  else if (privatePct >= 5) score = 4;
  else if (counts.public_only > 0 && nonePct < 80) score = 3;
  else if (nonePct >= 90) score = 0;
  else score = 2;

  const finding =
    `${privatePct}% of workspaces use a private module registry ` +
    `(${counts.harness_private} Harness, ${counts.other_private} other private). ` +
    `${nonePct}% have no registry standardisation (${counts.none} git-only / unset). ` +
    `${counts.public_only} use public registry only.`;

  const recommendation =
    nonePct >= 50
      ? "Adopt Harness Module Registry (or TFE/Artifactory) for approved modules — most workspaces today are git-sourced without registry governance."
      : harnessPct < 20
      ? "Expand Harness Module Registry adoption so teams pull versioned modules from a single governed catalog."
      : "Maintain registry governance — enforce allowed module sources via OPA workspace policies.";

  return { score, finding, recommendation };
}
