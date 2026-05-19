#!/usr/bin/env node
/**
 * Regression test for the monthly_growth chart-overlap fix.
 * Renders three increasingly-pathological cases of growth chip text and
 * writes them to /tmp so the user can eyeball them in Quick Look.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { renderChart } from "../build/charts/index.js";

const out = "/tmp/growth-chart-fix";
mkdirSync(out, { recursive: true });

const points = [
  { label: "Jun '25", workspaces: 2, pipelines: 11 },
  { label: "Jul '25", workspaces: 6, pipelines: 12 },
  { label: "Aug '25", workspaces: 10, pipelines: 20 },
  { label: "Sep '25", workspaces: 22, pipelines: 28 },
  { label: "Oct '25", workspaces: 41, pipelines: 46 },
  { label: "Nov '25", workspaces: 66, pipelines: 57 },
  { label: "Dec '25", workspaces: 119, pipelines: 72 },
  { label: "Jan '26", workspaces: 222, pipelines: 84 },
  { label: "Feb '26", workspaces: 337, pipelines: 138 },
  { label: "Mar '26", workspaces: 568, pipelines: 253 },
  { label: "Apr '26", workspaces: 741, pipelines: 456 },
  { label: "May '26", workspaces: 857, pipelines: 718 },
];

const cases = [
  {
    name: "01-short-chips-twilio-style",
    data: {
      title: "IaCM Growth — Workspaces & Pipelines (12 months)",
      subtitle: "Cumulative totals · account-wide",
      growth: { workspaces: "+855 / 12 mo", pipelines: "+707 / 12 mo" },
      points,
    },
  },
  {
    name: "02-medium-chips-autodesk-style",
    data: {
      title: "IaCM Growth — Workspaces & Pipelines (12 months)",
      subtitle: "Cumulative totals · account-wide",
      growth: { workspaces: "855 added · 116 in May '26", pipelines: "70 added · 52 in May '26" },
      points,
    },
  },
  {
    name: "03-pathologically-long-chips",
    data: {
      title: "IaCM Growth — Workspaces & Pipelines (12 months)",
      subtitle: "Cumulative totals · account-wide",
      growth: {
        workspaces: "+855 added across 12 mo (peak +173 in Apr 2026)",
        pipelines:  "+707 added across 12 mo (peak +203 in Apr 2026)",
      },
      points,
    },
  },
];

for (const c of cases) {
  const svg = renderChart({ chart_kind: "monthly_growth", data: c.data });
  const path = `${out}/${c.name}.svg`;
  writeFileSync(path, svg);
  console.log(`wrote ${path} (${svg.length} bytes)`);
}
