---
title: "Harness IaCM — Business Value Review"
subtitle: "Infrastructure as Code Management · Adoption, Maturity & Governance Assessment"
customer: "Account: SxuV0ChbRqWGSYClFlMQMQ"
docType: "Business Value Review"
date: "May 9, 2026"
author: "Harness IaCM MCP Agent"
classification: "Confidential"
---

# Harness IaCM — Business Value Review

**Generated:** May 9, 2026 | **Account:** SxuV0ChbRqWGSYClFlMQMQ | **Source:** Live Harness Platform APIs

---

## Executive Summary

::: metrics
- label: Maturity Score
  value: "58 / 100"
  trend: WALK Tier
  tone: warning
- label: IaCM Projects
  value: "9"
  trend: 2 active
  tone: neutral
- label: Workspaces
  value: "22"
  trend: across 2 projects
  tone: positive
- label: Pipelines
  value: "15"
  trend: across 3 projects
  tone: positive
- label: OPA Coverage
  value: "100%"
  trend: all pipelines governed
  tone: positive
- label: Checkov Adoption
  value: "13%"
  trend: 2 of 15 pipelines
  tone: critical
- label: Cost Estimation
  value: "0%"
  trend: 0 of 22 workspaces
  tone: critical
- label: IaCM Templates
  value: "0%"
  trend: none in use
  tone: risk
:::

This account is in the **WALK** maturity tier with a score of **58/100**. The foundation is strong — 22 workspaces, 15 pipelines with excellent type diversity, and 100% OPA governance coverage. The path to **RUN** (70+ points) requires 12 more points, achievable primarily by enabling cost estimation and expanding Checkov security scanning.

::: success
Strengths: Full pipeline type coverage (provision, destroy, drift, approval, OpenTofu), 100% OPA pipeline enforcement, 46 authored policies, Jira-to-IaCM automation, multi-provisioner support.
:::

::: critical
Critical gaps: Cost estimation disabled on all 22 workspaces (0%), Checkov scanning on only 2 of 15 pipelines (13%), zero IaCM template adoption, 4 of 6 OPA policy sets inactive.
:::

---

## Section I — Maturity Assessment

### 1.1 Crawl / Walk / Run Score

::: metrics
- label: Workspace Adoption
  value: "15 / 20"
  trend: 22 workspaces
  tone: positive
- label: Pipeline Adoption
  value: "15 / 15"
  trend: 15 pipelines
  tone: positive
- label: Pipeline Diversity
  value: "10 / 10"
  trend: all 5 types present
  tone: positive
- label: Checkov Scans
  value: "2 / 15"
  trend: 13% adoption
  tone: critical
- label: Cost Estimation
  value: "0 / 15"
  trend: 0% adoption
  tone: critical
- label: OPA Coverage
  value: "10 / 10"
  trend: 100% pipelines
  tone: positive
- label: OPA Policy Sets
  value: "3 / 5"
  trend: 2 active sets
  tone: warning
- label: IaCM Templates
  value: "0 / 5"
  trend: not adopted
  tone: risk
- label: Multi-Project
  value: "3 / 5"
  trend: 2 active projects
  tone: warning
:::

| Dimension | Score | Max | % | Status |
|-----------|-------|-----|---|--------|
| Workspace Adoption | 15 | 20 | 75% | Good |
| Pipeline Adoption | 15 | 15 | 100% | Excellent |
| Pipeline Type Diversity | 10 | 10 | 100% | Excellent |
| Checkov Security Scans | 2 | 15 | 13% | Critical |
| Cost Estimation | 0 | 15 | 0% | Critical |
| OPA Pipeline Coverage | 10 | 10 | 100% | Excellent |
| OPA Policy Sets | 3 | 5 | 60% | Good |
| IaCM Templates | 0 | 5 | 0% | Not Started |
| Multi-Project Adoption | 3 | 5 | 60% | Good |
| **Total** | **58** | **100** | **58%** | **WALK** |

### 1.2 Path to RUN Tier

::: info
The RUN tier threshold is 70 points. This account needs 12 more points. The fastest path: enable cost estimation on all workspaces (+15 pts potential) and expand Checkov to all pipelines (+13 pts potential). Achieving either one moves this account to RUN.
:::

| Action | Points Gained | Effort |
|--------|--------------|--------|
| Enable cost estimation on all 22 workspaces | Up to +15 | Low |
| Expand Checkov to all 15 pipelines | Up to +13 | Medium |
| Enable 4 disabled OPA policy sets | +2 | Low |
| Create and adopt IaCM templates | Up to +5 | Medium |
| Activate IaCM in dormant projects | +2 | Low |

---

## Section II — IaCM Footprint

### 2.1 Account Inventory

::: metrics
- label: Total Orgs
  value: "2"
  tone: neutral
- label: IACM Projects
  value: "9"
  tone: neutral
- label: Active Projects
  value: "2"
  trend: 7 dormant
  tone: warning
- label: Terraform WS
  value: "19"
  tone: positive
- label: OpenTofu WS
  value: "3"
  tone: positive
- label: Total Pipelines
  value: "15"
  tone: positive
:::

| Org | Project | Workspaces | Pipelines | Status |
|-----|---------|-----------|----------|--------|
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
7 of 9 IaCM-enabled projects are dormant — the module is licensed but unused. Expanding IaCM to these projects using templates from the primary project requires minimal effort and grows the maturity score.
:::

### 2.2 gketest — Primary Project (19 Workspaces)

| Tier | Count | Provisioner | Status |
|------|-------|-------------|--------|
| DEV | 7 | Terraform | Mixed |
| QA | 6 | Terraform | Mixed |
| PROD | 3 | Terraform | Active |
| OpenTofu | 3 | OpenTofu | Mixed |

::: risk
4 workspaces are in **failed** status, 4 are **apply_needed** — 36% of the estate has unresolved drift or provisioning failures. These represent potential orphaned resources and operational risk.
:::

---

## Section III — Pipeline Adoption

### 3.1 Pipeline Inventory

| Pipeline | Project | Provision | Destroy | Drift | Checkov | OPA |
|----------|---------|-----------|---------|-------|---------|-----|
| Jira EC2 Provisioning | gketest | Yes | No | No | Yes | Yes |
| s3-dev-apply | gketest | Yes | No | No | Yes | Yes |
| Jira S3 Provisioning | gketest | Yes | No | No | No | Yes |
| IaCM Jira Automation | gketest | Yes | No | No | No | Yes |
| create-s3-site | gketest | Yes | No | No | No | Yes |
| s3-dev-destroy | gketest | No | Yes | No | No | Yes |
| s3-prod-apply | gketest | Yes | No | No | No | Yes |
| s3-dev-drift | gketest | No | No | Yes | No | Yes |
| tofus3-deploy | gketest | Yes | No | No | No | Yes |
| tofus3-destroy | gketest | No | Yes | No | No | Yes |
| iacm-provision-pipeline | chaos_project | Yes | No | No | No | Yes |
| iamcm-destroy-pipeline | chaos_project | No | Yes | No | No | Yes |
| ccm_connector_creation | chaos_project | No | No | No | No | Yes |
| Demo_Pipeline | chaos_project | No | No | No | No | Yes |
| Selective Approval Notification | CCM-Demo | No | No | No | No | Yes |

::: info
Pipeline type diversity is excellent — all 5 types are present: provision, destroy, drift detection, approval workflow, and OpenTofu. The Jira-to-IaCM automation pattern (3 pipelines) and drift detection show advanced platform usage.
:::

### 3.2 Feature Adoption Scorecard

::: metrics
- label: Checkov Scans
  value: "2 / 15"
  trend: 13% — 13 pipelines exposed
  tone: critical
- label: Cost Estimation
  value: "0 / 22"
  trend: 0% — all workspaces blind
  tone: critical
- label: IaCM Templates
  value: "0 / 15"
  trend: 0% — no standardisation
  tone: risk
- label: Private Registry
  value: "0 / 22"
  trend: public registry only
  tone: neutral
:::

| Feature | Scope | Adopted | Total | % | Priority |
|---------|-------|---------|-------|---|----------|
| Checkov Security Scans | Pipelines | 2 | 15 | 13% | P1 |
| Cost Estimation | Workspaces | 0 | 22 | 0% | P1 |
| IaCM Templates | Pipelines | 0 | 15 | 0% | P2 |
| Private Module Registry | Workspaces | 0 | 22 | 0% | P3 |

---

## Section IV — Security and Governance

### 4.1 Checkov Security Scanning

::: critical
Only 2 of 15 pipelines (13%) run Checkov security scans. 13 pipelines provision, modify, or destroy infrastructure with no misconfiguration detection. This includes all production pipelines except s3-dev-apply.

Pipelines WITH Checkov: s3-dev-apply, Jira EC2 Provisioning

Pipelines WITHOUT Checkov (13): Jira S3 Provisioning, IaCM Jira Automation, create-s3-site, s3-dev-destroy, s3-prod-apply, s3-dev-drift, tofus3-deploy, tofus3-destroy, iacm-provision-pipeline, iamcm-destroy-pipeline, ccm_connector_creation, Demo_Pipeline, Selective Approval Notification Pipeline
:::

**Risk:** Without Checkov, misconfigurations such as public S3 buckets, missing encryption, open security groups, or untagged resources can be provisioned without automated detection.

**Recommendation:** Add the IaCMCheckov step to all provisioning pipelines in one sprint. Start with s3-prod-apply, tofus3-deploy, and s3-dev-destroy — the highest-impact pipelines.

### 4.2 OPA Policy Governance

::: metrics
- label: Total Policies
  value: "46"
  trend: all enabled
  tone: positive
- label: Active Policy Sets
  value: "2 / 6"
  trend: 4 disabled
  tone: warning
- label: Pipeline Coverage
  value: "100%"
  trend: 15 of 15
  tone: positive
- label: onRun Enforcement
  value: "0"
  trend: shift-left missing
  tone: risk
:::

| Policy Set | Trigger | Status | Policies | Covers |
|-----------|---------|--------|----------|--------|
| Cost-Estimate-OPA | afterTerraformPlan | Active | 1 | All pipelines |
| OpenTofuS3 | afterTerraformPlan | Active | 4 | All pipelines |
| New Policy Set - 10/13 | onRun | Disabled | 1 | All pipelines |
| s3-deny-without-lifecycle | afterTerraformPlan | Disabled | 1 | All pipelines |
| s3-opa-policies | afterTerraformPlan | Disabled | 3 | All pipelines |
| s3-versioning-opentofu | afterTerraformPlan | Disabled | 0 | All pipelines |

::: success
All 15 IaCM pipelines (100%) are covered by the 2 active account-level policy sets. Every pipeline execution is subject to cost estimation and OpenTofu S3 governance.
:::

::: warning
4 of 6 policy sets containing 5 S3 compliance rules are disabled. These policies are fully authored and validated — enabling them requires a single toggle per set with zero authoring effort. This adds: S3 deny-without-lifecycle, S3 versioning, 3 additional S3 compliance rules.
:::

::: risk
All active policy sets use afterTerraformPlan — enforcement only happens AFTER a plan is generated. The onRun policy set exists but is disabled. Enabling it provides shift-left governance — policy failures surface before any compute is consumed.
:::

### 4.3 IaCM-Specific Policy Library

| Policy | Category | Enforced |
|--------|----------|----------|
| open-tofu | OpenTofu Governance | Yes (OpenTofuS3) |
| opentofu-s3-blockpublic | S3 Security | Yes (OpenTofuS3) |
| opentofu-s3-bucket-logging | S3 Compliance | Yes (OpenTofuS3) |
| opentofu-s3-lifecycle-policy | S3 Compliance | Yes (OpenTofuS3) |
| opentofu-s3-tags | S3 Governance | Yes (OpenTofuS3) |
| Terraform Plan Cost - Cost Estimate Increased | Cost Guard | Yes (Cost-Estimate-OPA) |
| s3-deny-public-read-access | S3 Security | No — disabled |
| s3-deny-without-lifecycle | S3 Compliance | No — disabled |
| s3-enforce-versioning | S3 Compliance | No — disabled |
| s3-opentofu-sse | S3 Encryption | No — disabled |
| Terraform Plan Cost - Total Cost Estimate | Budget Enforcement | No — disabled |

---

## Section V — FinOps Integration

### 5.1 Cost Estimation

::: critical
Cost estimation is disabled on all 22 workspaces (0% adoption). No workspace provides pre-apply cost visibility. Infrastructure changes are provisioned with zero financial impact assessment until after resources are created.
:::

This is the single highest-impact improvement available. Enabling cost estimation:
- Surfaces cost diffs in the pipeline UI before apply
- Enables the existing Terraform Plan Cost OPA policies to enforce budget guardrails
- Integrates with Harness CCM for cross-workspace FinOps dashboards

**Recommendation:** Enable cost_estimation_enabled on all workspaces. Activate the Terraform Plan Cost — Total Cost Estimate policy set. Connect to Harness CCM.

### 5.2 Private Module Registry

All 22 workspaces use the public HashiCorp/OpenTofu registry. This is appropriate for current scale. As workspace count exceeds 30, a private registry provides version pinning, module governance, and internal approval workflows.

---

## Section VI — Recommended Next Steps

::: action
P1 — Enable Cost Estimation this week. Set cost_estimation_enabled to true on all 22 workspaces. Activate the Terraform Plan Cost — Total Cost Estimate OPA policy set. This single action gains up to 15 maturity points and moves the account to RUN tier on its own.
:::

::: action
P1 — Deploy Checkov to 13 pipelines this sprint. Add the IaCMCheckov step to s3-prod-apply, tofus3-deploy, s3-dev-destroy, and the remaining 10 pipelines. Prioritise production and destructive pipelines first.
:::

::: action
P1 — Enable 4 disabled OPA policy sets (1 hour effort). Toggle s3-deny-without-lifecycle, s3-opa-policies, and s3-versioning-opentofu to enabled in Harness Policy Management. Zero authoring effort — these are ready to enforce immediately.
:::

::: action
P2 — Enable onRun OPA enforcement. Toggle the New Policy Set - 10/13 to enabled. Create additional pre-run checks for workspace configuration validation. Shifts policy failures left — before plan generation.
:::

::: action
P2 — Create 3 canonical IaCM pipeline templates. Build a Provision template (plan + approval + apply), a Destroy template (approval + destroy), and a Drift Detection template. Migrate existing 15 pipelines to use them. Gains 5 maturity points and enforces consistent standards.
:::

::: action
P2 — Remediate 8 unhealthy workspaces. Fix 4 failed and 4 apply-needed workspaces to reduce operational risk and eliminate potential orphaned resource costs.
:::

### Priority Summary

| Priority | Action | Maturity Points | Effort |
|----------|--------|----------------|--------|
| P1 | Enable cost estimation on all workspaces | +15 | Low |
| P1 | Add Checkov to 13 pipelines | +13 | Medium |
| P1 | Enable 4 disabled OPA policy sets | +2 | Low |
| P2 | Enable onRun OPA enforcement | +2 | Low |
| P2 | Create and adopt IaCM pipeline templates | +5 | Medium |
| P2 | Remediate 8 unhealthy workspaces | Operational | Low |
| P3 | Activate IaCM in 7 dormant projects | +2 | Low |
| P3 | Private module registry | +0 now | High |

---

*Generated by Harness IaCM MCP Server · May 9, 2026 · CONFIDENTIAL*
*All data sourced live from Harness Platform APIs — account SxuV0ChbRqWGSYClFlMQMQ*
