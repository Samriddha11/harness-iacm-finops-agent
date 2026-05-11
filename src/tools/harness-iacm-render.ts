import * as z from "zod/v4";
import { existsSync } from "node:fs";
import { resolve, extname, basename, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { startReportServer, registerReport, getReportUrl } from "../report-renderer/server.js";

const THEMES = [
  "dark", "minimal", "ocean", "harness-pro", "kinetic", "black-lime",
  "carbon", "bluestone",
] as const;
type ThemeId = typeof THEMES[number];

const DEFAULT_PORT = 4321;

export function registerRenderTool(server: McpServer): void {
  server.registerTool(
    "harness_iacm_render_report",
    {
      description:
        "Render a Harness IaCM BVR or report markdown file as a live themed webpage. " +
        "Starts a local HTTP server and returns a URL to open in the browser. " +
        "The page includes a theme switcher with 8 executive-grade themes " +
        "(4 light, 4 dark) and a 'Download PDF' button (uses browser print-to-PDF, " +
        "no extra tools needed). input_path must be an absolute path to a .md file.",
      inputSchema: z.object({
        input_path: z
          .string()
          .describe("Absolute path to the markdown report file (e.g. /Users/me/reports/bvr/iacm-bvr.md)"),
        theme: z
          .enum([
            "dark", "minimal", "ocean", "harness-pro", "kinetic", "black-lime",
            "carbon", "bluestone",
          ])
          .describe(
            "Initial theme. " +
            "Light: minimal (Slate — cool indigo, modern SaaS), " +
            "harness-pro (Aurora — soft mint+teal), " +
            "kinetic (Sandstone — warm cream+amber, executive), " +
            "bluestone (Bluestone — formal navy+gray, very formal). " +
            "Dark: dark (Midnight — deep navy+blue), " +
            "ocean (Eclipse — charcoal+emerald), " +
            "black-lime (Obsidian — zinc black+gold), " +
            "carbon (Carbon — stone+crimson, premium luxury).",
          )
          .default("dark")
          .optional(),
        port: z
          .number()
          .min(1024)
          .max(65535)
          .describe(`Port for the local report server (default: ${DEFAULT_PORT})`)
          .default(DEFAULT_PORT)
          .optional(),
      }),
      annotations: {
        title: "Render IaCM Report → Webpage",
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const inputPath = resolve(args.input_path);
      const theme = (args.theme ?? "dark") as ThemeId;
      const port = args.port ?? DEFAULT_PORT;

      if (!existsSync(inputPath)) {
        return errorResult(`File not found: ${inputPath}`);
      }
      if (extname(inputPath).toLowerCase() !== ".md") {
        return errorResult(`Input must be a .md file. Got: ${inputPath}`);
      }

      // Start the renderer server (idempotent — reuses existing if already running)
      const actualPort = await startReportServer(port);

      // Register this report with a stable ID derived from filename
      const reportId = basename(inputPath, ".md")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-") +
        "-" + randomUUID().slice(0, 6);

      registerReport(reportId, inputPath, theme);
      const url = getReportUrl(reportId);

      return jsonResult({
        success: true,
        url,
        themeUrl: {
          slate:     `${url}?theme=minimal`,      // Slate     — light, indigo
          aurora:    `${url}?theme=harness-pro`,  // Aurora    — light, mint+teal
          sandstone: `${url}?theme=kinetic`,      // Sandstone — light, warm amber
          bluestone: `${url}?theme=bluestone`,    // Bluestone — light, formal navy+gray
          midnight:  `${url}?theme=dark`,         // Midnight  — dark, navy+blue
          eclipse:   `${url}?theme=ocean`,        // Eclipse   — dark, charcoal+emerald
          obsidian:  `${url}?theme=black-lime`,   // Obsidian  — dark, zinc+gold
          carbon:    `${url}?theme=carbon`,       // Carbon    — dark, stone+crimson
        },
        port: actualPort,
        message: [
          `Report is live at: ${url}`,
          `Open in your browser. Use the theme switcher in the top-right to change themes.`,
          `Click "Download PDF" (or Cmd/Ctrl+P) to save as PDF from the browser.`,
        ].join("\n"),
        tip: "The server stays running until you restart the MCP server. " +
             "Register multiple reports — they all share the same port.",
      });
    },
  );
}
