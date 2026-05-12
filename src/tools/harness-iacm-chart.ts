import * as z from "zod/v4";
import { writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, isAbsolute } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { ChartKindSchema, CHART_KINDS, renderChart } from "../charts/index.js";

/**
 * `harness_iacm_chart` — generate a polished, theme-friendly SVG chart and
 * write it to disk.
 *
 * The agent calls this tool for every chart that needs to appear in a
 * Harness IaCM BVR or report. Each generated SVG only uses hex codes that
 * the report renderer's theme system maps to CSS variables, so the chart
 * automatically recolours on every theme (Harness, Aurora, Sandstone,
 * Bluestone, Midnight, Eclipse, Obsidian, Carbon) without regeneration.
 *
 * Use this INSTEAD OF FinOps' `harness_ccm_finops_chart` whenever the data
 * is IaCM-flavoured (workspaces, pipelines, OPA policy sets, maturity).
 */
export function registerChartTool(server: McpServer): void {
  server.registerTool(
    "harness_iacm_chart",
    {
      description:
        "Render a polished SVG chart for IaCM BVR/report use and save it " +
        "to disk. Always pass an ABSOLUTE output_path inside your workspace " +
        "(typically <bvr-folder>/assets/<name>.svg). The SVG is theme-aware " +
        "— it auto-recolours when the report is rendered with any of the 8 " +
        "themes. Supported chart_kinds:\n\n" +
        "  • scorecard       — row of metric tiles (1–6); use at the top of a BVR\n" +
        "  • maturity_radar  — N-axis spider chart with central score (CRAWL/WALK/RUN/FLY)\n" +
        "  • feature_gauges  — circular progress rings for feature-adoption %\n" +
        "  • opa_donut       — active vs disabled policy-set donut + side legend\n" +
        "  • org_footprint   — diverging bars (workspaces left, pipelines right) + DNA chip\n" +
        "  • priority_matrix — 3-lane recommendation cards (P1/P2/P3) with effort chips\n" +
        "  • bar             — generic horizontal bar chart for any rankable counts\n" +
        "  • monthly_growth  — dual-line cumulative chart of workspaces + pipelines over N months (pair with harness_iacm_growth)\n\n" +
        "Each chart_kind has a precise data schema — call this tool with " +
        "chart_kind first to get the right shape, then fill it from your scan results.",
      inputSchema: z.object({
        chart_kind: z
          .enum(CHART_KINDS)
          .describe("Which chart to render. See description for layout per kind."),
        data: z
          .record(z.string(), z.unknown())
          .describe("Chart data. Shape depends on chart_kind — see harness_iacm_describe('chart_<kind>') or the tool description above."),
        output_path: z
          .string()
          .describe("ABSOLUTE filesystem path where the SVG should be written. Parent directories are auto-created. Example: /Users/me/work/proj/reports/bvr/assets/scorecard.svg"),
        overwrite: z
          .boolean()
          .default(true)
          .describe("If false and the file exists, the call fails. Defaults to true.")
          .optional(),
      }),
      annotations: {
        title: "Render IaCM SVG chart",
        readOnlyHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      // Validate the discriminated input
      const parsed = ChartKindSchema.safeParse({
        chart_kind: args.chart_kind,
        data:       args.data,
      });
      if (!parsed.success) {
        return errorResult(
          `Invalid chart data for kind '${args.chart_kind}': ` +
          parsed.error.issues.map((iss) => `${iss.path.join(".")}: ${iss.message}`).join("; "),
        );
      }

      // Validate path
      if (!isAbsolute(args.output_path)) {
        return errorResult(
          `output_path must be absolute. Received: ${args.output_path}. ` +
          "The MCP server runs in its own working directory, so relative paths cannot resolve to your workspace.",
        );
      }
      const outPath = resolve(args.output_path);
      if (!/\.svg$/i.test(outPath)) {
        return errorResult(`output_path must end with .svg (got: ${outPath})`);
      }
      if (args.overwrite === false && existsSync(outPath)) {
        return errorResult(`File already exists and overwrite=false: ${outPath}`);
      }

      // Ensure parent dir
      const dir = dirname(outPath);
      try {
        mkdirSync(dir, { recursive: true });
      } catch (err) {
        return errorResult(`Failed to create directory ${dir}: ${(err as Error).message}`);
      }

      // Render + write
      let svg: string;
      try {
        svg = renderChart(parsed.data);
      } catch (err) {
        return errorResult(`Chart render failed: ${(err as Error).message}`);
      }

      try {
        writeFileSync(outPath, svg, "utf-8");
      } catch (err) {
        return errorResult(`Failed to write ${outPath}: ${(err as Error).message}`);
      }

      const size = statSync(outPath).size;

      return jsonResult({
        success: true,
        chart_kind: args.chart_kind,
        output_path: outPath,
        size_bytes: size,
        markdown_ref: `![${args.chart_kind}](assets/${outPath.split("/").pop()})`,
        message:
          `Wrote ${args.chart_kind} (${size} bytes) to ${outPath}. ` +
          `Reference it from your markdown report with the markdown_ref above ` +
          `(adjust the path if your markdown isn't in the same parent directory).`,
      });
    },
  );
}
