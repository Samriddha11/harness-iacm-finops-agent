import * as z from "zod/v4";
import { existsSync, readFileSync } from "node:fs";
import { resolve, extname } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { validateBvrMarkdown, formatViolations } from "../utils/bvr-validator.js";

/**
 * Standalone preflight tool for BVR canonical-structure validation.
 *
 * Exposes the same validator that gates `harness_iacm_render_report` and
 * `harness_iacm_markdown_to_pdf`, so agents can verify a BVR matches the
 * canonical template *before* attempting to render. Useful while
 * iterating on the markdown — call this after each significant edit.
 *
 * Returns a structured report:
 *   {
 *     valid: boolean,
 *     mode: "canonical" | "custom",
 *     violations: [...],
 *     warnings:   [...],
 *     detectedSections: [...],
 *     formatted:  "<human-readable issue list>"
 *   }
 *
 * The renderer/PDF tools call this same function internally and refuse
 * to produce output when `valid === false` and `mode === "canonical"`.
 */
export function registerBvrValidateTool(server: McpServer): void {
  server.registerTool(
    "harness_iacm_bvr_validate",
    {
      description:
        "Preflight a Harness IaCM Business Value Review (BVR) markdown file " +
        "against the canonical structure rules. Returns a structured report " +
        "of violations (missing sections, out-of-order sections, missing " +
        "frontmatter fields, unknown ::: directives) and warnings. The " +
        "renderer (harness_iacm_render_report) and PDF generator " +
        "(harness_iacm_markdown_to_pdf) refuse to produce output when " +
        "validation fails — use this tool to fix the document before render.",
      inputSchema: z.object({
        input_path: z
          .string()
          .describe("Absolute path to the BVR markdown file to validate."),
      }),
      annotations: {
        title: "Validate BVR Markdown — canonical-structure preflight",
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const inputPath = resolve(args.input_path);

      if (!existsSync(inputPath)) {
        return errorResult(`File not found: ${inputPath}`);
      }
      if (extname(inputPath).toLowerCase() !== ".md") {
        return errorResult(`Input must be a .md file. Got: ${inputPath}`);
      }

      const md = readFileSync(inputPath, "utf8");
      const result = validateBvrMarkdown(md);
      const formatted = formatViolations(result);

      return jsonResult({
        valid: result.valid,
        mode: result.mode,
        inputPath,
        violations: result.violations,
        warnings: result.warnings,
        detectedSections: result.detectedSections,
        formatted: formatted || "OK — no violations or warnings.",
        guidance: result.valid
          ? "BVR is canonical and ready to render. Call harness_iacm_render_report or harness_iacm_markdown_to_pdf."
          : "BVR does not match the canonical template. Fix the violations above, OR set frontmatter 'bvr_template: \"custom\"' if this is intentionally a non-BVR document.",
      });
    },
  );
}
