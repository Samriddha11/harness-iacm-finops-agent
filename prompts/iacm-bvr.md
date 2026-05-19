# IaCM BVR — saved prompt template

Copy-paste this into a Cursor / Claude Desktop chat to produce a tool-validated IaCM Business Value Review.

The prompt is designed as a **convenience layer on top of the tool-side validation**. The real safety guarantees are baked into the MCP tools (paginated workspace counting, `_meta.workspaceCountMethod`) and into `harness_iacm_guide` (which encodes the validation checklist). This prompt just nudges the agent to actually run the checklist instead of skipping it.

---

## Prompt — copy from here

```
Produce an IaCM Business Value Review for the currently authenticated Harness account.

Required workflow (do not skip steps):

1. Call harness_iacm_guide first. Follow its "BVR ground-truth validation" rules.

2. Account inventory in this order:
   - harness_iacm_list resource_type=harness_org
   - harness_iacm_scan
   - harness_iacm_feature_scan
   - harness_iacm_opa_scan
   - harness_iacm_growth months=12
   - harness_iacm_maturity_assessment

3. Validation gate — before producing any chart, markdown, or PDF:
   - Confirm every scan's _meta.workspaceCountMethod == "paginated-exhaustive".
   - Sum workspaces across orgs from harness_iacm_scan and reconcile to the
     IaCM dashboard total. If they disagree by more than 5%, STOP and report
     the discrepancy back to me — do not proceed to chart or markdown
     generation until the totals are reconciled.
   - List any projects in _meta.projectsHittingWorkspaceCap (informational —
     these have >=30 workspaces, useful colour for the narrative).
   - List any projects in _meta.unreachableProjectsForWorkspaces and explicitly
     flag them in the report's methodology appendix.

4. Charts — generate all eight canonical kinds via harness_iacm_chart:
   scorecard, maturity_radar, feature_gauges, opa_donut, org_footprint,
   priority_matrix, monthly_growth, plus a bar chart of the top 10 projects
   by workspace count.

5. Markdown narrative — frontmatter, executive summary with scorecard, account
   at a glance, maturity radar, feature gauges, OPA donut, growth section, org
   footprint, priority matrix, strategic narrative, and:
   - Appendix A — Top 15 orgs by workspace count
   - Appendix B — Methodology with countMethod for each metric, the
     reconciliation result, and the wall-clock time of data collection

6. Render — harness_iacm_render_report (live HTML, theme switcher) AND
   harness_iacm_markdown_to_pdf (offline PDF) — return both URLs/paths.

Customer data hygiene:
- Save artifacts to reports/<short-customer-tag>-bvr-<YYYY-MM-DD>/.
- Do not commit the report folder to git unless I explicitly say so.
- Use absolute paths for chart output_path (the MCP server runs in a
  different cwd than my workspace).

Anti-patterns to refuse:
- Publishing a BVR with unaudited counts.
- Single-page workspace fetches outside the bundled tools.
- "Plausibility" judgements about totals — always reconcile to the dashboard.
- Customer-named reports committed to the public repo.
```

---

## Use it

In Cursor:
- Paste the block above into a fresh chat
- Optionally edit the `<short-customer-tag>` placeholder to something specific
- Send it

In Claude Desktop / any MCP client:
- Same as above; the tool calls will run identically because the tool surface and the guide are the same

If you want a one-line trigger, save this as a Cursor Custom Command (Settings → Custom Commands → Add) and assign it to a slash like `/iacm-bvr`.
