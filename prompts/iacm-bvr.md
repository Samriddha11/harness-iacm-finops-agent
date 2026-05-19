# IaCM BVR — saved prompt template

Copy-paste this into a Cursor / Claude Desktop chat to produce a tool-validated, structurally-consistent IaCM Business Value Review.

This is a **convenience layer on top of three tool-side guarantees**:

1. The MCP **`iacm_bvr` prompt** at `src/prompts/iacm-bvr.ts` is the single authoritative recipe — fixed section structure, fixed chart placement, fixed callout vocabulary, fixed frontmatter contract.
2. The MCP tools paginate workspace counts and emit `_meta.workspaceCountMethod` so undercounts are detectable.
3. `harness_iacm_guide` and `.cursor/rules/iacm-bvr.mdc` encode the validation discipline.

The prompt below just nudges the agent to actually invoke the canonical recipe instead of reinventing the structure.

---

## Prompt — copy from here

```
Produce an IaCM Business Value Review for the currently authenticated Harness account.

Required workflow (do not skip steps, do not invent structure):

1. Call harness_iacm_guide first. Follow its "BVR ground-truth validation"
   rules and its canonical structure section.

2. Invoke the iacm_bvr MCP prompt with:
     customer_name: <the actual customer name on the cover>
     workspace_root: <the absolute path to my workspace root>
     theme: minimal      (or whichever theme I asked for)
   This pulls in the canonical 6-section recipe with exact section headings,
   chart shapes, callout vocabulary, and frontmatter contract. The output
   MUST follow this structure verbatim:

     Frontmatter (title, customer, date, defaultTheme, heroStats)
     Executive Summary                       [scorecard]
     1. Enterprise Footprint                 [org_footprint + monthly_growth]
     2. Maturity Assessment — <tier> Tier    [maturity_radar + dimension table]
     3. Feature Adoption                     [feature_gauges]
     4. OPA Governance                       [opa_donut]
     5. Recommended Actions                  [priority_matrix]
     6. Before & After                       [pain/gain comparison table]
     Appendix — Organisation Summary

   Do not add, remove, rename, or reorder sections. Do not invent new
   ::: directive types — only success, critical, warning, info, action, quote.

3. Account inventory in this order:
   - harness_iacm_list resource_type=harness_org
   - harness_iacm_scan
   - harness_iacm_workspace_inventory (fetch_details: true)
   - harness_iacm_feature_scan
   - harness_iacm_opa_scan
   - harness_iacm_growth months=12
   - harness_iacm_maturity_assessment

   Visual/layout reference (structure only — never copy another customer's numbers):
   Tu/Autodesk-style BVR + Twilio reference PDF. Every report must include:
   - Cover: 4 hero tiles (workspaces, pipelines, OPA %, maturity)
   - Exec scorecard: 5 tiles incl. Projects count
   - §1: org footprint + Top 10 Projects bar + growth w/ +N/12mo chips
   - §1.1 workspace status + §1.2 provisioner sprawl (workspace_inventory)
   - §3: 4 feature gauges + Feature|Adoption|Note table + §3.1 module registry bar
   - §4: OPA donut; policy-set table when sets > 0
   - §5: priority matrix + action callouts with Effort · +pts
   - Appendix: org table with # column, project summary, methodology block

4. Validation gate — before producing any chart, markdown, or PDF:
   - Confirm every scan's _meta.workspaceCountMethod == "paginated-exhaustive".
   - Sum workspaces across orgs from harness_iacm_scan and reconcile to the
     IaCM dashboard total. If they disagree by more than 5%, STOP and report
     the discrepancy back to me — do not proceed to chart or markdown
     generation until the totals are reconciled.
   - List any projects in _meta.projectsHittingWorkspaceCap (informational —
     these have >=30 workspaces, useful colour for the narrative).
   - List any projects in _meta.unreachableProjectsForWorkspaces and
     explicitly flag them in the Appendix.

5. Charts — embed inline chart fences inside the markdown
   (```chart <kind> ... ```) following the data shapes defined in the
   iacm_bvr prompt. Do not pre-render SVG files unless I explicitly ask.

6. Markdown — save to reports/<short-customer-tag>-bvr-<YYYY-MM-DD>/iacm-bvr.md
   in my workspace_root. Use the canonical 6-section structure (see Step 2).
   Frontmatter MUST include bvr_template: "canonical".

7. Preflight — call harness_iacm_bvr_validate with the markdown path.
   If it reports violations, FIX them before continuing. Do not skip
   validation. Do not flip bvr_template to "custom" unless I explicitly
   asked for a non-canonical structure.

8. Render — harness_iacm_render_report (live HTML, theme switcher) AND
   harness_iacm_markdown_to_pdf (offline PDF) — return both URLs/paths.
   Both tools run the validator again as a hard gate; if step 7 was
   clean these will succeed without issue.

Customer data hygiene:
- reports/* is gitignored by default. Do not commit the report folder
  unless I explicitly say so.
- Use absolute paths for any chart output_path (the MCP server runs in a
  different cwd than my workspace).

Anti-patterns — refuse if asked:
- Inventing new top-level sections beyond the canonical 6.
- Renaming "Recommended Actions" to "Path to <Tier>" or similar.
- Single-page workspace fetches outside the bundled tools.
- Publishing a BVR with unaudited counts or unreconciled totals.
- Customer-named reports committed to the public repo.
```

---

## Use it

In Cursor:
- Paste the block above into a fresh chat
- Optionally edit the `<short-customer-tag>` placeholder to something specific
- Send it

In Claude Desktop / any MCP client:
- Same. The tool calls and the canonical `iacm_bvr` MCP prompt run identically because both live in the MCP server, not in the prompt text.

If you want a one-line trigger, save this as a Cursor Custom Command (Settings → Custom Commands → Add) and assign it to a slash like `/iacm-bvr`.

## Why this is a thin layer

The structural guarantees do not live in this file. They live in:

1. `src/prompts/iacm-bvr.ts` — the authoritative `iacm_bvr` MCP prompt with section headings, chart shapes, callout vocabulary
2. `.cursor/rules/iacm-bvr.mdc` — auto-injected project rule
3. `src/tools/harness-iacm-guide.ts` — the agent guide every session reads first
4. `src/utils/iacm-pagination.ts` — the workspace counting helper that prevents under-reports

This file is a copy-paste convenience and the **weakest** of the four layers. If a user pastes a different prompt, the other three layers must still produce a structurally consistent BVR.
