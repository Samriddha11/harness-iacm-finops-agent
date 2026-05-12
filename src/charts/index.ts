import * as z from "zod/v4";
import * as gen from "./generators.js";

/**
 * Discriminated-union schema for the `harness_iacm_chart` tool input.
 *
 * Each `chart_kind` has its own `data` shape, validated separately. This
 * keeps the tool's contract precise and lets the agent get correct
 * autocomplete + validation errors per kind.
 */
const scorecardData = z.object({
  tiles: z.array(z.object({
    value: z.string().describe("The big number, formatted (e.g. '2,461' or '74/100' or '100%')"),
    label: z.string().describe("Short ALL-CAPS-friendly label (e.g. 'Workspaces')"),
    sub:   z.string().optional().describe("Tiny subtitle line (e.g. 'across 34 orgs')"),
  })).min(1).max(6).describe("1–6 tiles. 5 is the sweet spot for one row."),
  title: z.string().optional(),
});

const radarDimension = z.object({
  label: z.array(z.string()).min(1).max(2).describe("1–2 line label, e.g. ['Workspace','Adoption']"),
  score: z.number().nonnegative(),
  max:   z.number().positive(),
});
const maturityRadarData = z.object({
  dimensions:  z.array(radarDimension).min(3).max(12),
  centerValue: z.union([z.number(), z.string()]).describe("Big number in the centre disc"),
  centerSub:   z.string().optional().describe("e.g. 'out of 100'"),
  centerTier:  z.string().optional().describe("e.g. 'RUN' (CRAWL/WALK/RUN/FLY auto-coloured)"),
  title:       z.string().optional(),
});

const featureGaugesData = z.object({
  gauges: z.array(z.object({
    label:  z.array(z.string()).min(1).max(2),
    pct:    z.number().min(0).max(100),
    status: z.enum(["good","warn","bad","neutral"]).optional()
              .describe("Override colour. If omitted, derived from pct (≥80 green, ≥40 blue, >0 red, =0 grey)."),
  })).min(2).max(8),
  title: z.string().optional(),
});

const opaDonutData = z.object({
  total:        z.number().int().nonnegative(),
  active:       z.number().int().nonnegative(),
  disabled:     z.number().int().nonnegative(),
  centerValue:  z.string().optional(),
  centerLabel:  z.string().optional().describe("Small label inside the donut, e.g. 'policy sets'"),
  centerSub:    z.string().optional().describe("Bottom-of-disc highlight, e.g. '100% pipeline coverage'"),
  activeLabel:  z.string().optional().describe("Legend heading override (default 'ACTIVE (N)')"),
  disabledLabel:z.string().optional(),
  activeItems:  z.array(z.string()).optional().describe("Up to 8 names listed under ACTIVE legend"),
  disabledItems:z.array(z.string()).optional().describe("Up to 6 names listed under DISABLED legend"),
  title:        z.string().optional(),
});

const orgFootprintData = z.object({
  orgs: z.array(z.object({
    name: z.string(),
    ws:   z.number().int().nonnegative().describe("Workspace count"),
    pl:   z.number().int().nonnegative().describe("Pipeline count"),
  })).min(1).max(12).describe("Top N orgs by total IaCM footprint (10 is the sweet spot)"),
  title: z.string().optional(),
});

const priorityLane = z.object({
  badge: z.string().describe("Short badge, typically 'P1' / 'P2' / 'P3'"),
  label: z.string().describe("Lane title, e.g. 'Do Now' / 'This Quarter' / 'Next Quarter'"),
  sub:   z.string().describe("Short clarifying line, e.g. 'Config only — no engineering'"),
  color: z.enum(["p1","p2","p3"]).optional()
           .describe("Override accent colour (p1=danger, p2=warning, p3=info). Defaults to lane index."),
  actions: z.array(z.object({
    text:   z.string().describe("Concise action description (≤ 26 chars per line, wraps automatically)"),
    effort: z.enum(["Low","Medium","High"]),
  })).min(1).max(6),
});
const priorityMatrixData = z.object({
  lanes: z.array(priorityLane).min(1).max(3),
  title: z.string().optional(),
});

const barData = z.object({
  bars: z.array(z.object({
    label: z.string(),
    value: z.number(),
    tone:  z.enum(["primary","secondary","tertiary","success","warning","danger"]).optional(),
  })).min(1).max(20),
  title:  z.string().optional(),
  unit:   z.string().optional().describe("Suffix appended to each value (e.g. '%')"),
  prefix: z.string().optional().describe("Prefix prepended to each value (e.g. '$')"),
});

const monthlyGrowthData = z.object({
  points: z.array(z.object({
    label:      z.string().describe("Short month label, e.g. \"Jun '25\""),
    workspaces: z.number().int().nonnegative().describe("Cumulative workspace count at month end"),
    pipelines:  z.number().int().nonnegative().describe("Cumulative pipeline count at month end"),
  })).min(2).max(36).describe("Time-ordered points, oldest first. 12 = sweet spot."),
  title:    z.string().optional(),
  subtitle: z.string().optional().describe("Optional one-line subtitle, e.g. 'Last 12 months · cumulative totals'"),
  growth:   z.object({
    workspaces: z.string().optional().describe("Pre-formatted growth chip text, e.g. '+40% / 12 mo'"),
    pipelines:  z.string().optional().describe("Pre-formatted growth chip text, e.g. '+39% / 12 mo'"),
  }).optional(),
});

export const ChartKindSchema = z.discriminatedUnion("chart_kind", [
  z.object({ chart_kind: z.literal("scorecard"),       data: scorecardData       }),
  z.object({ chart_kind: z.literal("maturity_radar"),  data: maturityRadarData   }),
  z.object({ chart_kind: z.literal("feature_gauges"),  data: featureGaugesData   }),
  z.object({ chart_kind: z.literal("opa_donut"),       data: opaDonutData        }),
  z.object({ chart_kind: z.literal("org_footprint"),   data: orgFootprintData    }),
  z.object({ chart_kind: z.literal("priority_matrix"), data: priorityMatrixData  }),
  z.object({ chart_kind: z.literal("bar"),             data: barData             }),
  z.object({ chart_kind: z.literal("monthly_growth"),  data: monthlyGrowthData   }),
]);

export type ChartKindInput = z.infer<typeof ChartKindSchema>;

/** Render a chart spec to an SVG string. Throws if data fails validation. */
export function renderChart(input: ChartKindInput): string {
  switch (input.chart_kind) {
    case "scorecard":       return gen.scorecard(input.data);
    case "maturity_radar":  return gen.maturityRadar(input.data);
    case "feature_gauges":  return gen.featureGauges(input.data);
    case "opa_donut":       return gen.opaDonut(input.data);
    case "org_footprint":   return gen.orgFootprint(input.data);
    case "priority_matrix": return gen.priorityMatrix(input.data);
    case "bar":             return gen.bar(input.data);
    case "monthly_growth":  return gen.monthlyGrowth(input.data);
  }
}

/** Friendly list of supported chart kinds for tool descriptions. */
export const CHART_KINDS = [
  "scorecard", "maturity_radar", "feature_gauges",
  "opa_donut", "org_footprint", "priority_matrix", "bar",
  "monthly_growth",
] as const;
