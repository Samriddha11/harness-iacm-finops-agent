/**
 * Provisioner version sprawl scoring for IaCM maturity (BVR).
 */

export interface VersionSprawlInput {
  /** Distinct exact pins (e.g. 1.5.7, 0.13.7). */
  distinctExactVersions: number;
  /** Distinct major.minor groupings (e.g. terraform 1.5.x). */
  distinctMajorMinorLines: number;
  /** Share of workspaces on the single largest version line (0–100). */
  dominantLinePct: number;
  totalWorkspaces: number;
}

export function scoreVersionSprawlMaturity(input: VersionSprawlInput): {
  score: number;
  finding: string;
  recommendation: string;
} {
  const { distinctExactVersions, distinctMajorMinorLines, dominantLinePct, totalWorkspaces } = input;

  if (totalWorkspaces === 0) {
    return {
      score: 0,
      finding: "No workspaces to evaluate for provisioner version sprawl.",
      recommendation: "Create workspaces with a single standard Terraform/OpenTofu version per environment tier.",
    };
  }

  let score = 10;

  // Exact pin sprawl
  if (distinctExactVersions <= 2) score = 10;
  else if (distinctExactVersions <= 4) score = 8;
  else if (distinctExactVersions <= 6) score = 6;
  else if (distinctExactVersions <= 10) score = 4;
  else score = 2;

  // Major.minor line sprawl (additional penalty)
  if (distinctMajorMinorLines >= 8) score = Math.max(0, score - 3);
  else if (distinctMajorMinorLines >= 6) score = Math.max(0, score - 2);
  else if (distinctMajorMinorLines >= 4) score = Math.max(0, score - 1);

  // Concentration bonus — one line dominates
  if (dominantLinePct >= 70) score = Math.min(10, score + 1);
  if (dominantLinePct < 30) score = Math.max(0, score - 2);

  const sprawlLabel =
    distinctExactVersions <= 3
      ? "low sprawl — versions are well standardised"
      : distinctExactVersions <= 8
      ? "moderate sprawl — multiple version lines in use"
      : "high sprawl — many distinct provisioner versions";

  const finding =
    `${distinctExactVersions} distinct provisioner version pins and ` +
    `${distinctMajorMinorLines} major.minor lines across ${totalWorkspaces} workspaces — ${sprawlLabel}. ` +
    `Largest single line covers ${dominantLinePct}% of workspaces.`;

  const recommendation =
    distinctExactVersions > 6
      ? "Standardise on 1–2 supported Terraform lines per tier (e.g. 1.5.x non-prod, 1.9.x prod/FedRAMP) and migrate legacy 0.13.x/0.15.x workspaces."
      : "Document the approved version matrix and enforce via workspace templates and OPA workspace policies.";

  return { score, finding, recommendation };
}

export function sprawlFromVersionLabels(
  versionLabels: Array<{ label: string; count: number }>,
  totalWorkspaces: number,
): VersionSprawlInput {
  const distinctMajorMinorLines = versionLabels.length;
  const dominantLinePct =
    totalWorkspaces > 0 && versionLabels.length > 0
      ? Math.round((versionLabels[0]!.count / totalWorkspaces) * 100)
      : 0;
  // Exact versions approximated by summing isn't available here — caller passes exact count
  return {
    distinctExactVersions: 0,
    distinctMajorMinorLines,
    dominantLinePct,
    totalWorkspaces,
  };
}
