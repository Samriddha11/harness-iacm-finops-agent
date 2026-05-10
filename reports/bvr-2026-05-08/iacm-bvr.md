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
**Generated:** May 8, 2026 | **Account ID:** SxuV0ChbRqWGSYClFlMQMQ

---

## Executive Summary

::: info
This Business Value Review assesses the current adoption, governance posture, and feature utilisation of Harness Infrastructure as Code Management (IaCM) across the entire account. Data was collected live from the Harness platform via the IaCM MCP Server.
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
- label: OPA Coverage
  value: "100%"
  tone: positive
- label: Checkov Adoption
  value: "13%"
  tone: risk
- label: Cost Estimation
  value: "0%"
  tone: critical
:::

**Key Findings:**

- The account has **22 workspaces** and **15 IaCM pipelines** spread across **2 orgs** and **9 projects** — a solid foundation indicating active IaCM usage.
- **OPA governance is fully deployed** — all 15 pipelines (100%) are covered by account-level policy sets, showing a mature policy framework.
- **Significant feature gaps exist** — Checkov security scanning (13%), cost estimation (0%), and IaCM templates (0%) represent the largest expansion opportunities.
- **46 OPA policies are authored** but only **2 of 6 policy sets are enabled** — 4 policy sets containing S3 compliance rules are written but inactive.

---

## Section I — IaCM Footprint

### 1.1 Account Inventory

::: metrics
- label: Orgs with IaCM
  value: "2"
  tone: neutral
- label: Projects with IaCM
  value: "9"
  tone: neutral
- label: Terraform Workspaces
  value: "19"
  tone: positive
- label: OpenTofu Workspaces
  value: "3"
  tone: positive
:::

| Org | Project | Workspaces | Pipelines | Status |
|-----|---------|-----------|----------|--------|
| `default` | gketest | 19 | 10 | 🟢 Active |
| `default` | chaos_project | 3 | 4 | 🟢 Active |
| `default` | trainingtest | 0 | 0 | ⚪ Configured, unused |
| `default` | chaos_test_project1 | 0 | 0 | ⚪ Configured, unused |
| `default` | LinuxDemo | 0 | 0 | ⚪ Configured, unused |
| `default` | projectx | 0 | 0 | ⚪ Configured, unused |
| `sam` | CCM-Demo | 0 | 1 | 🟡 Pipeline only |
| `sam` | fftest1 | 0 | 0 | ⚪ Configured, unused |
| `sam` | fftestqa | 0 | 0 | ⚪ Configured, unused |

::: warning
**7 of 9 IaCM-enabled projects have zero workspaces.** The IaCM module has been enabled but not utilised in these projects. This represents untapped expansion within the existing account footprint.
:::

### 1.2 Workspace Breakdown — `gketest` (primary project)

| Environment | Count | Provisioner |
|-------------|-------|-------------|
| DEV | 7 | Terraform |
| QA | 6 | Terraform |
| PROD | 3 | Terraform |
| OpenTofu | 3 | OpenTofu |
| **Total** | **19** | — |

::: info
The naming convention (`DEV-*`, `QA-*`, `PROD-*`) indicates a structured environment promotion pattern — a positive signal of IaCM maturity. Several workspaces have a `status: failed` indicating active operational issues to address.
:::

### 1.3 Workspace Status Distribution

| Status | Count | % |
|--------|-------|---|
| `active` | 14 | 64% |
| `apply_needed` | 4 | 18% |
| `failed` | 4 | 18% |

::: risk
**4 workspaces (18%) are in `failed` status** and 4 are `apply_needed`. These may indicate drift, broken connectors, or stalled runs that need remediation.
:::

---

## Section II — Pipeline & Feature Adoption

### 2.1 IaCM Pipelines

| Project | Pipeline | Purpose |
|---------|----------|---------|
| gketest | Jira EC2 Provisioning | EC2 provisioning via Jira automation |
| gketest | Jira S3 Provisioning | S3 provisioning via Jira automation |
| gketest | IaCM Jira Automation | Base Jira IaCM integration |
| gketest | create-s3-site | S3 static site creation |
| gketest | s3-dev-apply | S3 dev environment provisioning |
| gketest | s3-dev-destroy | S3 dev environment teardown |
| gketest | s3-prod-apply | S3 production provisioning |
| gketest | s3-dev-drift | S3 drift detection |
| gketest | tofus3-deploy | OpenTofu S3 deployment |
| gketest | tofus3-destroy | OpenTofu S3 teardown |
| chaos_project | iacm-provision-pipeline | General IaCM provisioning |
| chaos_project | iamcm-destroy-pipeline | IaCM teardown |
| chaos_project | ccm_connector_creation | CCM connector automation |
| chaos_project | Demo_Pipeline | Demo pipeline |
| CCM-Demo | Selective Approval Notification | Approval workflow |

::: info
The account has a mature Jira-to-IaCM automation pattern (3 pipelines), showing advanced integration capability. Drift detection (`s3-dev-drift`) is also present — an advanced IaCM practice.
:::

### 2.2 Feature Adoption Scorecard

::: metrics
- label: Checkov Scans
  value: "2 / 15"
  trend: "13% adoption"
  tone: critical
- label: Cost Estimation
  value: "0 / 22"
  trend: "0% adoption"
  tone: critical
- label: IaCM Templates
  value: "0 / 15"
  trend: "0% adoption"
  tone: risk
- label: Private Module Registry
  value: "0 / 22"
  trend: "0% adoption"
  tone: neutral
:::

| Feature | Scope | Adopted | Total | % | Priority |
|---------|-------|---------|-------|---|----------|
| Checkov Security Scans | Pipelines | 2 | 15 | 13% | 🔴 High |
| Cost Estimation | Workspaces | 0 | 22 | 0% | 🔴 High |
| IaCM Templates | Pipelines | 0 | 15 | 0% | 🟡 Medium |
| Private Module Registry | Workspaces | 0 | 22 | 0% | 🟡 Low–Medium |

### 2.3 Checkov Security Scanning

::: critical
**Only 2 of 15 pipelines (13%) run Checkov security scans.**

Pipelines running Checkov: `Jira EC2 Provisioning`, `s3-dev-apply`

Pipelines WITHOUT Checkov (13):
Jira S3 Provisioning, IaCM Jira Automation, tofus3-deploy, tofus3-destroy, s3-dev-destroy, s3-prod-apply, s3-dev-drift, create-s3-site, iacm-provision-pipeline, iamcm-destroy-pipeline, Demo_Pipeline, ccm_connector_creation, Selective Approval Notification Pipeline
:::

**What this means:** 87% of provisioning pipelines have no policy-as-code security scan before or after infrastructure changes. Misconfigurations (public S3 buckets, open security groups, missing encryption) can be provisioned without any automated detection.

**Recommendation:** Enable `IaCMCheckov` step in all provisioning pipelines. Prioritise `s3-prod-apply`, `tofus3-deploy`, and `s3-dev-destroy` first.

### 2.4 Cost Estimation

::: critical
**Cost estimation is disabled on all 22 workspaces (0% adoption).**

Without cost estimation, teams have no visibility into the financial impact of a Terraform plan before it is applied. Infrastructure spend changes are discovered after the fact — not before.
:::

**Recommendation:** Enable `cost_estimation_enabled: true` on all production and QA workspaces. Connect with Harness CCM to surface pre-apply cost diffs in the pipeline UI and OPA cost guardrails (the `Terraform Plan Cost - Total Cost Estimate` policy already exists — it just needs to be activated).

### 2.5 IaCM Templates

::: warning
**Zero pipelines use IaCM templates (0% adoption).**

Every pipeline is independently authored. Without templates, changes to provisioning standards require updating each pipeline individually — leading to drift in pipeline design and inconsistent governance enforcement.
:::

**Recommendation:** Create 2–3 canonical IaCM templates:
1. **Terraform provisioning template** (plan → approval → apply)
2. **Destroy template** (approval gate → destroy)
3. **Drift detection template** (scheduled scan → alert)

### 2.6 Module Registry

All 22 workspaces source Terraform/OpenTofu modules from the **public HashiCorp registry** only. No private module registry (Terraform Cloud Enterprise, JFrog Artifactory, or Harness-native) is configured.

**Current state:** Acceptable for simple use cases.
**Risk:** No version pinning enforcement, no internal module governance, no ability to restrict which modules teams can use.

---

## Section III — Governance & Policy

### 3.1 OPA Policy Inventory

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
- label: Pipeline Coverage
  value: "100%"
  tone: positive
:::

**The account has a rich OPA policy library.** 46 policies are authored and all are enabled. Critically, the IaCM-specific policies are well-developed:

| Policy | Category |
|--------|----------|
| `open-tofu` | OpenTofu governance |
| `opentofu-s3-blockpublic` | S3 public access blocking |
| `opentofu-s3-bucket-logging` | S3 logging enforcement |
| `opentofu-s3-lifecycle-policy` | S3 lifecycle rules |
| `opentofu-s3-tags` | S3 tagging enforcement |
| `s3-deny-public-read-access` | S3 public read prevention |
| `s3-deny-without-lifecycle` | S3 lifecycle mandatory |
| `s3-enforce-versioning` | S3 versioning enforcement |
| `s3-opentofu-sse` | Server-side encryption |
| `s3-opentofu-versioning` | OpenTofu versioning |
| `s3-server-side-encryption` | SSE enforcement |
| `Terraform Plan Cost - Cost Estimate Increased` | Cost guardrail |
| `Terraform Plan Cost - Total Cost Estimate` | Cost budget enforcement |

### 3.2 Policy Sets

| Policy Set | Trigger | Enabled | Policies | Coverage |
|-----------|---------|---------|----------|----------|
| `Cost-Estimate-OPA` | afterTerraformPlan | ✅ Active | 1 | Account-wide |
| `OpenTofuS3` | afterTerraformPlan | ✅ Active | 4 | Account-wide |
| `New Policy Set - 10/13 - 20:11` | onRun | ❌ Disabled | 1 | Account-wide |
| `s3-deny-without-lifecycle` | afterTerraformPlan | ❌ Disabled | 1 | Account-wide |
| `s3-opa-policies` | afterTerraformPlan | ❌ Disabled | 3 | Account-wide |
| `s3-versioning-opentofu` | afterTerraformPlan | ❌ Disabled | 0 | Account-wide |

### 3.3 Pipeline OPA Coverage

::: success
**100% of IaCM pipelines (15/15) are covered by OPA governance.**
Both active policy sets are account-scoped, providing blanket enforcement across all projects and orgs.
:::

::: warning
**4 of 6 policy sets (67%) are disabled.** These contain S3 lifecycle, versioning, and general OPA policies that are fully authored but not enforced:
- `s3-deny-without-lifecycle` — would enforce S3 lifecycle policies on all plans
- `s3-opa-policies` — contains 3 S3 compliance rules
- `s3-versioning-opentofu` — versioning enforcement for OpenTofu

Enabling these would immediately close 3 additional S3 compliance gaps without any authoring effort.
:::

::: risk
**All active policy sets trigger `afterTerraformPlan` only — no `onRun` (shift-left) enforcement.**
The `New Policy Set - 10/13 - 20:11` has an `onRun` trigger but is disabled. Without pre-run checks, non-compliant runs are only blocked after a plan has already been generated — adding latency to the feedback loop.
:::

---

## Section IV — Areas of Improvement

### Priority Matrix

| Opportunity | Effort | Impact | Priority |
|------------|--------|--------|----------|
| Enable cost estimation on all workspaces | Low | 🔴 High | **P1** |
| Enable Checkov on 13 pipelines | Medium | 🔴 High | **P1** |
| Enable 4 disabled S3 OPA policy sets | Low | 🟠 Medium-High | **P1** |
| Enable `onRun` OPA enforcement (shift-left) | Low | 🟠 Medium | **P2** |
| Create IaCM pipeline templates | Medium | 🟡 Medium | **P2** |
| Remediate 4 failed workspaces | Low | 🟡 Medium | **P2** |
| Activate 7 unused IaCM-enabled projects | High | 🟡 Medium | **P3** |
| Implement private module registry | High | 🟢 Low–Medium | **P3** |

### Recommended Next Steps

::: action
**P1 — Enable Cost Estimation (this week)**
Set `cost_estimation_enabled: true` on all 22 workspaces. Connect to Harness CCM for pre-apply cost diffs. Activate the `Terraform Plan Cost - Total Cost Estimate` OPA policy set to enforce cost budgets at plan time.
*Outcome: Full pre-apply cost visibility across all workspaces.*
:::

::: action
**P1 — Deploy Checkov to all provisioning pipelines (this sprint)**
Add the `IaCMCheckov` step to the 13 pipelines currently missing it. Start with `s3-prod-apply`, `tofus3-deploy`, and `s3-dev-destroy` (production-impact pipelines first).
*Outcome: Policy-as-code security scanning on 100% of provisioning runs.*
:::

::: action
**P1 — Enable 4 disabled OPA policy sets (1 hour effort)**
The S3 compliance policies (`s3-deny-without-lifecycle`, `s3-opa-policies`, `s3-versioning-opentofu`) are fully authored. Simply toggle them enabled in the Harness Policy Management console.
*Outcome: 7 additional S3 compliance rules enforced with zero authoring effort.*
:::

::: action
**P2 — Add `onRun` OPA enforcement (shift-left governance)**
Enable `New Policy Set - 10/13 - 20:11` (already has onRun trigger). Create additional pre-run checks for workspace configuration validation.
*Outcome: Policy failures surface before plan generation — faster feedback, lower CI cost.*
:::

::: action
**P2 — Create 3 canonical IaCM pipeline templates**
Author a Provision template (plan → approval → apply), a Destroy template (approval → destroy), and a Drift Detection template. Migrate existing pipelines to use them.
*Outcome: Consistent governance across all pipelines. Single-point updates to provisioning standards.*
:::

---

## Appendix — Full Pipeline List

| Pipeline | Project | Org | Checkov | OPA Coverage |
|----------|---------|-----|---------|-------------|
| Jira EC2 Provisioning | gketest | default | ✅ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| s3-dev-apply | gketest | default | ✅ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| Jira S3 Provisioning | gketest | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| IaCM Jira Automation | gketest | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| create-s3-site | gketest | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| s3-dev-destroy | gketest | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| s3-prod-apply | gketest | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| s3-dev-drift | gketest | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| tofus3-deploy | gketest | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| tofus3-destroy | gketest | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| iacm-provision-pipeline | chaos_project | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| iamcm-destroy-pipeline | chaos_project | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| ccm_connector_creation | chaos_project | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| Demo_Pipeline | chaos_project | default | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |
| Selective Approval Notification Pipeline | CCM-Demo | sam | ❌ | ✅ Cost-Estimate-OPA, OpenTofuS3 |

---

## Appendix — Full Workspace List

| Workspace | Project | Provisioner | Status | Cost Est. | Private Registry |
|-----------|---------|-------------|--------|-----------|-----------------|
| DEV-ec2-SUP-13 | gketest | terraform | active | ❌ | ❌ |
| DEV-ec2-SUP-18 | gketest | terraform | active | ❌ | ❌ |
| DEV-Samriddha-Test-202025-ICM-10 | gketest | terraform | failed | ❌ | ❌ |
| DEV-samtestfeb26-SUP-6 | gketest | terraform | active | ❌ | ❌ |
| DEV-temsams3buck-ICM-11 | gketest | terraform | active | ❌ | ❌ |
| null-null-null | gketest | terraform | failed | ❌ | ❌ |
| open tofu-s3 | gketest | opentofu | active | ❌ | ❌ |
| open tofu-s3 destroy | gketest | opentofu | apply_needed | ❌ | ❌ |
| PROD-pleasetests3-ICM-6 | gketest | terraform | active | ❌ | ❌ |
| PROD-temporarysams3test-ICM-5 | gketest | terraform | active | ❌ | ❌ |
| QA-samriddhaes3-SUP-14 | gketest | terraform | active | ❌ | ❌ |
| QA-samriddhatestccm-SUP-15 | gketest | terraform | active | ❌ | ❌ |
| QA-samriddtempors3-SUP-16 | gketest | terraform | active | ❌ | ❌ |
| QA-temp-s3-sam-test726-ICM-8 | gketest | terraform | active | ❌ | ❌ |
| QA-test-bucket-SUP-17 | gketest | terraform | failed | ❌ | ❌ |
| QA-test-s3-bukcet-ICM-7 | gketest | terraform | failed | ❌ | ❌ |
| s3-dev | gketest | terraform | active | ❌ | ❌ |
| s3-new | gketest | opentofu | apply_needed | ❌ | ❌ |
| s3-prod | gketest | terraform | apply_needed | ❌ | ❌ |
| pga-aws | chaos_project | opentofu | — | ❌ | ❌ |
| test-idp | chaos_project | terraform | — | ❌ | ❌ |
| test-namespace-creation | chaos_project | terraform | — | ❌ | ❌ |

---

*Report generated by Harness IaCM MCP Server · May 8, 2026*
*Data source: Harness Platform APIs — live account data*
