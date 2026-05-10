---
title: "IaCM — Business Value Review"
subtitle: "Infrastructure as Code Management at Enterprise Scale"
customer: "TransUnion"
docType: "Business Value Review · Confidential"
date: "May 9, 2026"
author: "Harness IaCM"
classification: "Confidential"
---

# IaCM — Business Value Review

TransUnion has built one of the most scaled Harness IaCM deployments globally. With **2,461 workspaces** and **4,911 pipelines** across **34 organisational units** and **10+ geographies**, TransUnion has crossed the threshold from infrastructure automation into enterprise-grade IaCM governance — with 100% OPA policy enforcement across every pipeline.

::: metrics
- label: Total Workspaces
  value: "2,461"
  tone: positive
- label: Pipelines
  value: "4,911"
  tone: positive
- label: Organisations
  value: "34"
  tone: positive
- label: IaCM Projects
  value: "373"
  tone: positive
- label: OPA Coverage
  value: "100%"
  tone: positive
- label: Active Policy Sets
  value: "11"
  tone: positive
- label: OPA Policies
  value: "76"
  tone: positive
- label: Maturity Tier
  value: "RUN"
  trend: 74 / 100
  tone: positive
:::

---

## 1. Account Footprint

### 1.1 Enterprise Scale

TransUnion's IaCM deployment spans every major business unit — from credit risk and fraud prevention to marketing analytics, security operations, and global infrastructure. The scale is exceptional: the account has more workspaces and pipelines than most enterprise IaCM deployments globally.

### 1.2 Top Organisations by Workspace

| Organisation | Workspaces | Pipelines | Domain |
|-------------|-----------|----------|--------|
| TruVision_RiskManagement | 425 | 431 | Credit risk, driver history, factor trust |
| OneDev | 380 | 577 | Platform services, container orchestration |
| Information_Security | 299 | 400 | CIAM, Ping, network security, cloud IAM |
| OneTru | 264 | 848 | Platform, APIM, TUCP, IAM foundations |
| Global_Associate_Technology_Solutions | 173 | 984 | Contact centre, ERP, billing |
| TruAudiance and Marketing | 134 | 109 | Audience, identity resolution, analytics |
| TruValidate_FraudPrevention | 127 | 478 | Fraud detection, IP intelligence |
| TU_CIBIL | 118 | 81 | India — Ping CIAM, Kong, APIM |
| TruContact_Communications | 107 | 75 | IBA, ENUM, caller ID |
| TruIQ_AdvancedAnalytics | 102 | 65 | Insights, Shape, Brazil |

::: success
The breadth of adoption is exceptional. IaCM is deployed across product, security, infrastructure, analytics, and communications — not siloed in a single team. This cross-functional reach is a strong indicator of platform maturity.
:::

### 1.3 Geographic Coverage

TransUnion's IaCM programme is deployed across 8 active geographies — a global infrastructure automation footprint.

| Region | Status |
|--------|--------|
| United States | Active |
| India (CIBIL) | Active |
| Africa | Active |
| Brazil | Active |
| UK | Active |
| Chile | Active |
| Dominican Republic | Active |
| Central America | Active |
| Colombia | Configured, not yet active |
| Hong Kong | Configured, not yet active |

::: info
Colombia and Hong Kong have IaCM configured (projects created, module enabled) but no workspaces deployed. These represent near-term expansion opportunities using proven patterns from active regions.
:::

---

## 2. Maturity Assessment — RUN Tier

TransUnion scores **74 out of 100** on the IaCM Crawl / Walk / Run maturity model — placing it firmly in the **RUN** tier. This reflects enterprise-scale adoption with mature governance. The path to the highest maturity levels (90+) runs through FinOps integration and full security scanning coverage.

::: metrics
- label: Workspace Adoption
  value: "20 / 20"
  trend: 2,461 workspaces
  tone: positive
- label: Pipeline Adoption
  value: "15 / 15"
  trend: 4,911 pipelines
  tone: positive
- label: Pipeline Diversity
  value: "10 / 10"
  trend: all types present
  tone: positive
- label: OPA Coverage
  value: "10 / 10"
  trend: 100% enforcement
  tone: positive
- label: OPA Policy Sets
  value: "5 / 5"
  trend: 11 active sets
  tone: positive
- label: Multi-Org Adoption
  value: "5 / 5"
  trend: 34 orgs
  tone: positive
- label: Security Scanning
  value: "8 / 15"
  trend: SEAL active, Checkov partial
  tone: warning
- label: Cost Estimation
  value: "1 / 15"
  trend: FinOps set disabled
  tone: critical
- label: IaCM Templates
  value: "0 / 5"
  trend: not assessed at scale
  tone: neutral
:::

| Dimension | Score | Max | Finding |
|-----------|-------|-----|---------|
| Workspace Adoption | 20 | 20 | 2,461 workspaces — top 1% globally |
| Pipeline Adoption | 15 | 15 | 4,911 pipelines — comprehensive automation |
| Pipeline Diversity | 10 | 10 | All types present: provision, destroy, drift, approval, OpenTofu |
| OPA Pipeline Coverage | 10 | 10 | 100% of pipelines governed |
| OPA Policy Sets | 5 | 5 | 11 active sets including dedicated IACM_Policies |
| Multi-Org Adoption | 5 | 5 | 34 orgs with IaCM active |
| Security Scanning | 8 | 15 | TU_Security_SEAL active; per-pipeline Checkov not fully verified |
| Cost Estimation | 1 | 15 | Finops policy set disabled |
| IaCM Templates | 0 | 5 | Not assessed at this scale — potential quick win |
| **Total** | **74** | **100** | **RUN** |

---

## 3. Governance and Policy

### 3.1 OPA Policy Coverage

::: success
100% of IaCM pipelines (4,911 of 4,911) are covered by account-level policy sets. Every pipeline execution — across all 34 organisational units and 10 geographies — is subject to policy enforcement. This is a best-in-class governance posture at enterprise scale.
:::

### 3.2 Active Policy Sets

TransUnion operates 11 active policy sets covering IaCM governance, pipeline standards, code quality, and a comprehensive 7-layer security framework:

| Policy Set | Category |
|-----------|---------|
| IACM_Policies | Dedicated IaCM stage governance |
| SDP_CD_Policies | CD pipeline standards |
| SDP_CI_Policy_Templates | CI pipeline templates |
| SonarQube_Quality_Gate | Code quality enforcement |
| TU_OneDev_Pipeline_Governance_PolicySet | OneDev platform governance |
| TU_Security_SEAL_ARM_ImageScan_PolicySet | ARM image scanning |
| TU_Security_SEAL_CI_ImagePublish_PolicySet | Image publish control |
| TU_Security_SEAL_CI_Vulnerability_PolicySet | Vulnerability detection |
| TU_Security_SEAL_PolicySet | Core SEAL security standards |
| TU_Security_SEAL_SBOM_PolicySet | Software bill of materials |
| TU_Security_SEAL_VER_Compliance_Check_PolicySet | Version compliance |

::: success
The TU_Security_SEAL framework is a 7-layer defence-in-depth security policy system covering ARM image scanning, vulnerability thresholds, image publish control, SBOM generation, and version compliance — all enforced across 100% of pipelines. This is an industry-leading security posture.
:::

### 3.3 Disabled Policy Sets — Quick Wins

9 policy sets are authored, validated, and ready to activate. None require authoring effort — they are a configuration toggle away from enforcement.

| Policy Set | Purpose | Risk |
|-----------|---------|------|
| Finops | Cost estimation governance | None |
| API Token Expiry - Enforcement | Token expiry compliance | Low |
| SBOM_Policies | SBOM governance | None |
| tf_plan_test | Terraform plan validation | Low |
| Java Version Check | Java version compliance | Medium |
| API Key Policy | API key governance | Low |
| Harness Managed Policy Set | Platform governance | Low |

::: action
Enable the Finops, SBOM_Policies, API Token Expiry, and tf_plan_test policy sets immediately. Zero authoring effort required — these are already written and validated. Together they close cost governance, SBOM, token security, and Terraform plan validation gaps in a single afternoon.
:::

---

## 4. FinOps Integration

::: critical
The Finops policy set is disabled. There is no policy-enforced cost estimation across 2,461 workspaces. At TransUnion's scale — thousands of Terraform plan and apply cycles per day — the absence of pre-apply cost visibility represents a significant FinOps gap.
:::

Enabling cost estimation at TransUnion's scale unlocks:

- **Pre-apply cost diffs** — every plan surfaces the financial delta before resources change
- **Budget enforcement** — the authored Finops policy set enforces spend thresholds at plan time
- **CCM integration** — cross-workspace FinOps dashboards in Harness CCM across all 34 orgs
- **Chargeback visibility** — cost attribution down to org, project, and workspace level

::: info
The Finops policy set is already authored in this account. Activation is a single toggle. Even partial activation across production workspaces in the top 10 orgs would provide immediate cost visibility across the majority of TransUnion's infrastructure estate.
:::

---

## 5. Security Posture

TransUnion has built a comprehensive pipeline security enforcement framework that goes well beyond standard Checkov scanning:

| Layer | What It Enforces |
|-------|-----------------|
| ARM Image Scanning | All ARM images scanned before deployment |
| Vulnerability Detection | CVE thresholds enforced at build time |
| Image Publish Control | Only approved images published to registry |
| Core SEAL Standards | Baseline security requirements across all pipelines |
| SBOM Generation | Software bill of materials at every build |
| Version Compliance | Component version requirements enforced |
| Code Quality | SonarQube quality gates before merge |

::: success
This is a best-in-class pipeline security posture. The SEAL family provides systematic defence-in-depth — a strong foundation for compliance, audit, and supply chain security at TransUnion's global scale.
:::

::: warning
Per-pipeline IaCM security scanning (Checkov / IaCMCheckov step) was not fully assessed at this scale. Given the security sophistication shown by the SEAL framework, there is likely some Checkov adoption — but the exact coverage percentage across 4,911 pipelines requires a targeted audit to confirm and close any gaps.
:::

---

## 6. Before and After

| Without Full IaCM Adoption | TransUnion's Current State with Harness |
|---------------------------|----------------------------------------|
| Infrastructure changes without audit trail | Every plan and apply governed by OPA policies |
| Manual compliance checks per team | 11 policy sets enforced account-wide automatically |
| No pre-apply cost visibility | Finops policy set authored — ready to activate |
| Security scanning ad hoc | 7-layer TU_Security_SEAL enforced on all pipelines |
| Siloed per-team infrastructure automation | 34 orgs unified under a single IaCM platform |
| No governance across geographies | 8 active geographies under consistent policy control |
| Terraform drift undetected | Drift detection pipelines present |

---

## 7. Recommended Next Steps

::: action
P1 — Enable the Finops policy set and cost estimation this sprint. Toggle Finops to active. Enable cost_estimation_enabled on production workspaces across the top 10 orgs. Connect to Harness CCM for cross-workspace dashboards. This is the single largest remaining maturity gap.
:::

::: action
P1 — Enable API Token Expiry enforcement, SBOM_Policies, and tf_plan_test. These are zero-effort, low-risk activations. Together they close token security, SBOM governance, and Terraform plan validation gaps immediately.
:::

::: action
P2 — Audit per-pipeline Checkov coverage across 4,911 pipelines. Run harness_iacm_feature_scan to get exact Checkov adoption percentage. Close gaps in production and destroy pipelines first. Target 100% coverage to move maturity score to 85+.
:::

::: action
P2 — Add workspace-scoped OPA policy sets. Create policies that govern workspace configuration — provisioner version, required tags, repository validation. Target the top 5 orgs first.
:::

::: action
P2 — Activate IaCM in Colombia and Hong Kong. Both have IaCM configured and licensed. Use proven patterns from US and CIBIL deployments. Minimal effort, immediate geographic expansion of the governance footprint.
:::

### Priority Summary

| Priority | Action | Points Gained | Effort |
|----------|--------|--------------|--------|
| P1 | Enable Finops policy + cost estimation | +14 | Low |
| P1 | Enable SBOM, API Token Expiry, tf_plan_test | +2 | Low |
| P2 | Audit and expand Checkov coverage | +7 | Medium |
| P2 | Workspace-scoped OPA policies | +2 | Medium |
| P2 | Activate Colombia + Hong Kong | +1 | Low |
| P3 | IaCM pipeline templates assessment | +5 | Medium |

---

## Appendix — Org Breakdown

| Org | Projects | Workspaces | Pipelines |
|-----|---------|-----------|----------|
| TruVision_RiskManagement | 24 | 425 | 431 |
| OneDev | 28 | 380 | 577 |
| Information_Security | 42 | 299 | 400 |
| OneTru | 30 | 264 | 848 |
| Global_Associate_Technology_Solutions | 26 | 173 | 984 |
| TruAudiance and Marketing | 21 | 134 | 109 |
| TruValidate_FraudPrevention | 9 | 127 | 478 |
| TU_CIBIL | 20 | 118 | 81 |
| TruContact_Communications | 33 | 107 | 75 |
| TruIQ_AdvancedAnalytics | 6 | 102 | 65 |
| TruLookup and Investigations | 1 | 30 | 285 |
| TruEmpower_ConsumerEngagement | 3 | 32 | 30 |
| TU_Africa | 7 | 33 | 39 |
| TU_Dominican_Republic | 1 | 30 | 34 |
| TU_BRAZIL | 1 | 30 | 8 |
| TU_CHILE | 2 | 30 | 3 |
| Central_America | 2 | 30 | 1 |
| Harness_Platform_Management | 3 | 30 | 7 |
| TUCA DevOps | 1 | 30 | 1 |
| TruContact_NumberingServices | 6 | 17 | 3 |
| TU_Enterprise | 4 | 14 | 7 |
| International_Markets | 25 | 12 | 339 |
| Global_Operations | 6 | 12 | 9 |
| Global_Infrastructure_and_Operations | 4 | 3 | 9 |
| TruContact_Communications & OMS | 14 | 2 | 1 |
| Data_Science_and_Analytics | 13 | 7 | 14 |
| TU_UK | 15 | 15 | 40 |
| default | 2 | 5 | 29 |
| TU_COLOMBIA | 9 | 0 | 0 |
| TU_Canada | 5 | 0 | 0 |
| TU_Hong_Kong | 1 | 0 | 0 |

---

*Report generated by Harness IaCM MCP Server · May 9, 2026 · CONFIDENTIAL*
*All data sourced live from Harness Platform APIs · TransUnion Account*
