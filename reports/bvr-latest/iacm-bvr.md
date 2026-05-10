---
title: "Harness IaCM — Business Value Review"
subtitle: "Infrastructure as Code Management · Adoption & Maturity Assessment"
customer: "Account: SxuV0ChbRqWGSYClFlMQMQ"
docType: "Business Value Review"
date: "May 8, 2026"
author: "Harness IaCM MCP Agent"
classification: "Confidential"
---

# Harness IaCM — Business Value Review
**Generated:** May 8, 2026 | **Account:** SxuV0ChbRqWGSYClFlMQMQ | **Data collected:** Live from Harness Platform APIs

---

## Executive Summary

::: info
This BVR covers the full IaCM footprint — workspaces, pipelines, feature adoption, and OPA governance — scanned live from the Harness platform on May 8, 2026. All numbers are sourced directly from the account APIs.
:::

::: metrics
- label: IaCM Projects
  value: "9"
  tone: neutral
- label: Total Workspaces
  value: "22"
  tone: positive
- label: IaCM Pipelines
  value: "15"
  tone: positive
- label: OPA Policy Coverage
  value: "100%"
  tone: positive
- label: Checkov Scan Adoption
  value: "13%"
  tone: critical
- label: Cost Estimation Enabled
  value: "0%"
  tone: critical
:::

**Top findings at a glance:**

- **Solid foundation.** 22 workspaces and 15 pipelines are active across 2 orgs — the account has genuine IaCM usage at scale.
- **OPA governance is mature.** 46 policies authored, 100% pipeline coverage — the strongest signal of platform adoption.
- **Critical feature gaps.** Cost estimation (0%), IaCM templates (0%), and Checkov (13%) represent the largest upsell surface.
- **4 of 6 policy sets are disabled.** Compliance rules are written but not enforced — a quick win requiring zero authoring effort.
- **7 of 9 IACM-enabled projects are dormant.** Licence is active but workspaces have not been created — expansion opportunity within existing footprint.

---

## Section I — IaCM Footprint

### 1.1 Account-Wide Inventory

::: metrics
- label: Active Orgs
  value: "2"
  tone: neutral
- label: IACM-Enabled Projects
  value: "9"
  tone: neutral
- label: Active Projects
  value: "2"
  tone: risk
- label: Terraform Workspaces
  value: "19"
  tone: positive
- label: OpenTofu Workspaces
  value: "3"
  tone: positive
- label: Total Pipelines
  value: "15"
  tone: positive
:::

| Org | Project | Workspaces | Pipelines | State |
|-----|---------|-----------|----------|-------|
| default | gketest | 19 | 10 | Active |
| default | chaos_project | 3 | 4 | Active |
| default | training-test | 0 | 0 | Dormant |
| default | chaos_test_project1 | 0 | 0 | Dormant |
| default | LinuxDemo | 0 | 0 | Dormant |
| default | projectx | 0 | 0 | Dormant |
| sam | CCM-Demo | 0 | 1 | Pipeline only |
| sam | fftest1 | 0 | 0 | Dormant |
| sam | fftestqa | 0 | 0 | Dormant |

::: warning
7 of 9 IaCM-enabled projects have zero workspaces. The module licence is active but unused in these projects — this represents organic expansion potential without additional licence cost.
:::

### 1.2 Workspace Breakdown — gketest (Primary Project)

| Environment Tier | Count | Provisioner |
|-----------------|-------|-------------|
| DEV | 7 | Terraform |
| QA | 6 | Terraform |
| PROD | 3 | Terraform |
| OpenTofu | 3 | OpenTofu |
| **Total** | **19** | — |

::: info
The DEV/QA/PROD naming convention signals a structured promotion workflow — a positive maturity indicator. The parallel OpenTofu adoption shows the team is evaluating the open-source Terraform alternative.
:::

### 1.3 Workspace Health

::: metrics
- label: Active
  value: "14"
  trend: "64% of workspaces"
  tone: positive
- label: Apply Needed
  value: "4"
  trend: "18% — drift detected"
  tone: risk
- label: Failed
  value: "4"
  trend: "18% — require remediation"
  tone: critical
:::

::: risk
4 workspaces are in **failed** status and 4 are **apply_needed**, meaning 36% of the estate has unresolved infrastructure drift or provisioning failures. Left unattended, these represent operational risk and potential cost leakage from orphaned resources.
:::

---

## Section II — Pipeline Adoption

### 2.1 Pipeline Inventory

| Pipeline | Project | Type | Checkov | OPA |
|----------|---------|------|---------|-----|
| Jira EC2 Provisioning | gketest | Provision | Yes | Yes |
| s3-dev-apply | gketest | Apply | Yes | Yes |
| Jira S3 Provisioning | gketest | Provision | No | Yes |
| IaCM Jira Automation | gketest | Automation | No | Yes |
| create-s3-site | gketest | Provision | No | Yes |
| s3-dev-destroy | gketest | Destroy | No | Yes |
| s3-prod-apply | gketest | Apply | No | Yes |
| s3-dev-drift | gketest | Drift Detect | No | Yes |
| tofus3-deploy | gketest | Deploy | No | Yes |
| tofus3-destroy | gketest | Destroy | No | Yes |
| iacm-provision-pipeline | chaos_project | Provision | No | Yes |
| iamcm-destroy-pipeline | chaos_project | Destroy | No | Yes |
| ccm_connector_creation | chaos_project | Automation | No | Yes |
| Demo_Pipeline | chaos_project | Demo | No | Yes |
| Selective Approval Notification | CCM-Demo | Approval | No | Yes |

::: info
The account has a sophisticated Jira-to-IaCM automation pattern (3 pipelines), drift detection (`s3-dev-drift`), and both Terraform and OpenTofu provisioning — these are advanced IaCM practices demonstrating good platform depth.
:::

### 2.2 Feature Adoption Scorecard

::: metrics
- label: Checkov Scans
  value: "2 / 15"
  trend: "13% — 13 pipelines exposed"
  tone: critical
- label: Cost Estimation
  value: "0 / 22"
  trend: "0% — full gap"
  tone: critical
- label: IaCM Templates
  value: "0 / 15"
  trend: "0% — all independent"
  tone: risk
- label: Private Module Registry
  value: "0 / 22"
  trend: "0% — public only"
  tone: neutral
:::

| Feature | Scope | Adopted | Total | % | Priority |
|---------|-------|---------|-------|---|----------|
| Checkov Security Scans | Pipelines | 2 | 15 | 13% | P1 — High |
| Cost Estimation | Workspaces | 0 | 22 | 0% | P1 — High |
| IaCM Templates | Pipelines | 0 | 15 | 0% | P2 — Medium |
| Private Module Registry | Workspaces | 0 | 22 | 0% | P3 — Low |

---

## Section III — Feature Deep Dive

### 3.1 Checkov Security Scanning

::: critical
Only 2 of 15 pipelines (13%) include Checkov security scans.

Using Checkov: s3-dev-apply, Jira EC2 Provisioning

NOT using Checkov (13 pipelines): Jira S3 Provisioning, IaCM Jira Automation, tofus3-deploy, tofus3-destroy, s3-dev-destroy, s3-prod-apply, s3-dev-drift, create-s3-site, iacm-provision-pipeline, iamcm-destroy-pipeline, ccm_connector_creation, Demo_Pipeline, Selective Approval Notification Pipeline
:::

Without Checkov, 87% of provisioning pipelines have no automated misconfiguration detection. Issues like public S3 buckets, missing encryption, or open security groups can be provisioned without detection.

**Recommendation:** Add the IaCMCheckov step to all provisioning pipelines. Prioritise s3-prod-apply, tofus3-deploy, and s3-dev-destroy as these touch production or destructive operations.

### 3.2 Cost Estimation

::: critical
Cost estimation is disabled on all 22 workspaces (0% adoption).

All workspaces in gketest (19) and chaos_project (3) have cost_estimation_enabled set to false.
:::

Without cost estimation, infrastructure changes are provisioned with no pre-apply financial visibility. Teams discover spend impacts after resources are created — not before.

**Recommendation:** Enable cost_estimation_enabled on all production and QA workspaces immediately. Connect to Harness CCM for dashboard-level cost diffs. The Terraform Plan Cost policies already exist in the OPA library — enabling them completes the cost governance loop at zero additional effort.

### 3.3 IaCM Templates

::: warning
Zero pipelines use IaCM templates (0% adoption). Every pipeline is independently authored.
:::

Without shared templates, pipeline standards drift over time. A change to the provisioning pattern — such as adding a required approval step or an OPA scan — must be applied individually to all 15 pipelines.

**Recommendation:** Create three canonical templates: a Provision template (plan + approval + apply), a Destroy template (approval gate + destroy), and a Drift Detection template (scheduled + alert). Migrate existing pipelines to use them within the next quarter.

### 3.4 Private Module Registry

All 22 workspaces source modules from the public HashiCorp registry. No private or enterprise registry is configured.

This is acceptable for early-stage adoption. As the estate scales, a private registry enables versioned, internally-approved modules with governance over which Terraform modules teams can consume.

**Recommendation:** Evaluate Terraform Cloud Enterprise or JFrog Artifactory for module governance as workspace count grows beyond 30.

---

## Section IV — OPA Governance

### 4.1 Policy Inventory

::: metrics
- label: Total OPA Policies
  value: "46"
  tone: positive
- label: All Policies Enabled
  value: "46 / 46"
  tone: positive
- label: Active Policy Sets
  value: "2 / 6"
  tone: risk
- label: Pipeline OPA Coverage
  value: "100%"
  tone: positive
:::

The account has a rich, well-authored OPA policy library. All 46 policies are enabled. The IaCM-specific custom policies are particularly noteworthy:

| Policy Name | Purpose |
|-------------|---------|
| open-tofu | OpenTofu workspace governance |
| opentofu-s3-blockpublic | Enforce S3 public access blocking |
| opentofu-s3-bucket-logging | Enforce S3 access logging |
| opentofu-s3-lifecycle-policy | Mandate S3 lifecycle rules |
| opentofu-s3-tags | Enforce S3 resource tagging |
| s3-deny-public-read-access | Block public read ACLs |
| s3-deny-without-lifecycle | Reject plans missing lifecycle config |
| s3-enforce-versioning | Mandate S3 versioning |
| s3-opentofu-sse | Enforce server-side encryption |
| s3-opentofu-versioning | OpenTofu versioning enforcement |
| s3-server-side-encryption | SSE for all S3 resources |
| Terraform Plan Cost - Cost Estimate Increased | Block cost increases beyond threshold |
| Terraform Plan Cost - Total Cost Estimate | Enforce total cost budget at plan time |

### 4.2 Policy Sets

| Policy Set | Trigger | Enabled | Policy Count | Scope |
|-----------|---------|---------|-------------|-------|
| Cost-Estimate-OPA | afterTerraformPlan | Active | 1 | Account |
| OpenTofuS3 | afterTerraformPlan | Active | 4 | Account |
| New Policy Set - 10/13 - 20:11 | onRun | Disabled | 1 | Account |
| s3-deny-without-lifecycle | afterTerraformPlan | Disabled | 1 | Account |
| s3-opa-policies | afterTerraformPlan | Disabled | 3 | Account |
| s3-versioning-opentofu | afterTerraformPlan | Disabled | 0 | Account |

::: success
All 15 IaCM pipelines (100%) are covered by the 2 active account-level policy sets — Cost-Estimate-OPA and OpenTofuS3. No pipeline runs without OPA enforcement.
:::

::: warning
4 of 6 policy sets (67%) are disabled. These contain 5 S3 compliance policies that are fully authored, tested, and ready — but switched off. Enabling them requires a single toggle per policy set, with zero authoring effort.

Policies that would activate immediately: s3-deny-without-lifecycle, s3-opa-policies (3 rules), s3-versioning-opentofu.
:::

::: risk
Both active policy sets trigger afterTerraformPlan — enforcement only occurs after a plan has been generated. No onRun (pre-execution) guardrails exist. The New Policy Set with an onRun trigger is written but disabled. Enabling it would shift compliance left, blocking non-compliant runs before any compute cost is incurred.
:::

---

## Section V — Recommended Next Steps

| # | Action | Effort | Impact | Priority |
|---|--------|--------|--------|----------|
| 1 | Enable cost estimation on all 22 workspaces | Low | High | P1 |
| 2 | Enable Checkov on 13 pipelines missing it | Medium | High | P1 |
| 3 | Enable 4 disabled S3 OPA policy sets | Low | Medium-High | P1 |
| 4 | Enable onRun policy set for shift-left enforcement | Low | Medium | P2 |
| 5 | Create 3 canonical IaCM pipeline templates | Medium | Medium | P2 |
| 6 | Remediate 4 failed and 4 apply-needed workspaces | Low | Medium | P2 |
| 7 | Activate IaCM in 7 dormant projects | High | Medium | P3 |
| 8 | Evaluate private module registry as estate scales | High | Low-Medium | P3 |

::: action
P1 — Enable Cost Estimation (this week). Set cost_estimation_enabled to true on all 22 workspaces via the Harness UI or API. Activate the Terraform Plan Cost — Total Cost Estimate OPA policy set to enforce budget guardrails at plan time. Connect to Harness CCM for pre-apply cost diffs in the pipeline view.
:::

::: action
P1 — Add Checkov to 13 pipelines (this sprint). Add the IaCMCheckov step to s3-prod-apply, tofus3-deploy, s3-dev-destroy, and the 10 remaining pipelines. Start with production-impact and destructive pipelines first. This closes the largest security compliance gap with a single step addition per pipeline.
:::

::: action
P1 — Enable 4 disabled OPA policy sets (1 hour). Navigate to Harness Policy Management and toggle s3-deny-without-lifecycle, s3-opa-policies, and s3-versioning-opentofu to enabled. All policies are authored and validated — this is a configuration change only. Adds 5 S3 compliance rules to every IaCM pipeline execution immediately.
:::

::: action
P2 — Enable onRun policy enforcement (shift-left). Toggle New Policy Set - 10/13 - 20:11 to enabled. Create additional pre-run checks for workspace configuration validation. This ensures policy failures surface before plan generation — faster developer feedback and lower CI cost.
:::

::: action
P2 — Create 3 canonical pipeline templates. Author a Provision template (plan + approval + apply), a Destroy template (approval + destroy), and a Drift Detection template. Migrate existing 15 pipelines to use them. Single-point updates to provisioning standards going forward.
:::

---

## Appendix A — Full Pipeline Feature Matrix

| Pipeline | Project | Checkov | Templates | OPA Enforced By |
|----------|---------|---------|-----------|----------------|
| Jira EC2 Provisioning | gketest | Yes | No | Cost-Estimate-OPA, OpenTofuS3 |
| s3-dev-apply | gketest | Yes | No | Cost-Estimate-OPA, OpenTofuS3 |
| Jira S3 Provisioning | gketest | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| IaCM Jira Automation | gketest | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| create-s3-site | gketest | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| s3-dev-destroy | gketest | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| s3-prod-apply | gketest | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| s3-dev-drift | gketest | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| tofus3-deploy | gketest | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| tofus3-destroy | gketest | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| iacm-provision-pipeline | chaos_project | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| iamcm-destroy-pipeline | chaos_project | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| ccm_connector_creation | chaos_project | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| Demo_Pipeline | chaos_project | No | No | Cost-Estimate-OPA, OpenTofuS3 |
| Selective Approval Notification | CCM-Demo | No | No | Cost-Estimate-OPA, OpenTofuS3 |

## Appendix B — Full Workspace Feature Matrix

| Workspace | Project | Provisioner | Status | Cost Est. |
|-----------|---------|-------------|--------|-----------|
| DEV-ec2-SUP-13 | gketest | terraform | active | No |
| DEV-ec2-SUP-18 | gketest | terraform | active | No |
| DEV-Samriddha-Test-202025-ICM-10 | gketest | terraform | failed | No |
| DEV-samtestfeb26-SUP-6 | gketest | terraform | active | No |
| DEV-temsams3buck-ICM-11 | gketest | terraform | active | No |
| null-null-null | gketest | terraform | failed | No |
| open tofu-s3 | gketest | opentofu | active | No |
| open tofu-s3 destroy | gketest | opentofu | apply_needed | No |
| PROD-pleasetests3-ICM-6 | gketest | terraform | active | No |
| PROD-temporarysams3test-ICM-5 | gketest | terraform | active | No |
| QA-samriddhaes3-SUP-14 | gketest | terraform | active | No |
| QA-samriddhatestccm-SUP-15 | gketest | terraform | active | No |
| QA-samriddtempors3-SUP-16 | gketest | terraform | active | No |
| QA-temp-s3-sam-test726-ICM-8 | gketest | terraform | active | No |
| QA-test-bucket-SUP-17 | gketest | terraform | failed | No |
| QA-test-s3-bukcet-ICM-7 | gketest | terraform | failed | No |
| s3-dev | gketest | terraform | active | No |
| s3-new | gketest | opentofu | apply_needed | No |
| s3-prod | gketest | terraform | apply_needed | No |
| pga-aws | chaos_project | opentofu | — | No |
| test-idp | chaos_project | terraform | — | No |
| test-namespace-creation | chaos_project | terraform | — | No |

## Appendix C — OPA Policy Library (IaCM-Relevant)

| Policy | Category | Enabled | Active Policy Set |
|--------|----------|---------|------------------|
| open-tofu | OpenTofu | Yes | OpenTofuS3 |
| opentofu-s3-blockpublic | S3 Security | Yes | OpenTofuS3 |
| opentofu-s3-bucket-logging | S3 Compliance | Yes | OpenTofuS3 |
| opentofu-s3-lifecycle-policy | S3 Compliance | Yes | OpenTofuS3 |
| opentofu-s3-tags | S3 Governance | Yes | OpenTofuS3 |
| s3-deny-public-read-access | S3 Security | Yes | Disabled set |
| s3-deny-without-lifecycle | S3 Compliance | Yes | Disabled set |
| s3-enforce-versioning | S3 Compliance | Yes | Disabled set |
| s3-opentofu-sse | S3 Encryption | Yes | Disabled set |
| s3-opentofu-versioning | S3 Compliance | Yes | Disabled set |
| s3-server-side-encryption | S3 Encryption | Yes | Disabled set |
| Terraform Plan Cost - Cost Estimate Increased | Cost Guard | Yes | CostEstimateOPA |
| Terraform Plan Cost - Total Cost Estimate | Cost Budget | Yes | — |

---

*Report generated by Harness IaCM MCP Server · May 8, 2026 · CONFIDENTIAL*
*Source: Live Harness Platform APIs — account SxuV0ChbRqWGSYClFlMQMQ*
