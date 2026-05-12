import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Render-existing prompt — open an existing BVR markdown file as a live
 * themed webpage and return URLs for every theme in one shot.
 *
 * Use cases:
 *   • "I just edited the BVR markdown — show me the live URL again"
 *   • "Customer wants to see this in their corporate brand colours"
 *   • Quick A/B compare across themes for sign-off
 *
 * Output: a primary URL + per-theme switcher URLs the user can paste
 * into a browser to compare looks side-by-side.
 */
export function registerRenderPrompt(server: McpServer): void {
  server.registerPrompt(
    "iacm_render",
    {
      description:
        "Open an existing BVR (or any markdown report) as a live webpage " +
        "in the canonical IaCM renderer. Returns the live URL plus one " +
        "URL per theme so you can switch between Harness brand, formal " +
        "Bluestone, premium Carbon, etc. without reloading the page.",
      argsSchema: {
        input_path: z
          .string()
          .describe(
            "ABSOLUTE path to the markdown report file. " +
            "Example: /Users/me/work/proj/reports/bvr-2026-05-11/iacm-bvr.md",
          ),
        theme: z
          .enum([
            "minimal", "harness-pro", "kinetic", "bluestone",
            "dark", "ocean", "black-lime", "carbon",
          ])
          .describe(
            "Initial theme. The user can still switch interactively in the " +
            "rendered page. Defaults to 'minimal' (Harness brand).",
          )
          .optional(),
        port: z
          .number()
          .min(1024)
          .max(65535)
          .describe("Local port for the renderer (defaults to 4321 if free, otherwise auto-picks).")
          .optional(),
      },
    },
    ({ input_path, theme, port }) => {
      const themeChoice = theme ?? "minimal";
      const portClause  = port ? `, "port": ${port}` : "";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `
# Render BVR — \`${input_path}\`

Open this report as a live themed webpage and surface every theme URL so
the user can pick the look that fits the audience.

## Step 1 — Verify the file exists

If \`${input_path}\` doesn't exist, stop and tell the user — don't try to
guess a different path. Suggest they use \`iacm_bvr\` to generate one.

## Step 2 — Render

\`\`\`json
{
  "tool": "harness_iacm_render_report",
  "input_path": "${input_path}",
  "theme": "${themeChoice}"${portClause}
}
\`\`\`

The response contains a \`url\` field plus a \`theme_urls\` map keyed by
theme id (one URL per theme). The renderer is started once and reused —
re-invoking this prompt with the same port returns the same base URL.

## Step 3 — Reply format

Return the URLs in a compact table the user can copy-paste:

\`\`\`
**Live BVR:** http://localhost:<port>/report/<id>?theme=${themeChoice}

**Switch theme:**

| Theme       | URL |
|-------------|-----|
| Harness     | http://.../?theme=minimal       (light, brand) |
| Aurora      | http://.../?theme=harness-pro   (light, calm)  |
| Sandstone   | http://.../?theme=kinetic       (light, warm)  |
| Bluestone   | http://.../?theme=bluestone     (light, formal)|
| Midnight    | http://.../?theme=dark          (dark, navy)   |
| Eclipse     | http://.../?theme=ocean         (dark, emerald)|
| Obsidian    | http://.../?theme=black-lime    (dark, gold)   |
| Carbon      | http://.../?theme=carbon        (dark, premium)|
\`\`\`

Add one short line of guidance:

- **Customer-facing:** \`minimal\` (Harness brand) or \`bluestone\`
  (financial / legal / government).
- **Executive deck:** \`kinetic\` (warm Sandstone) or \`carbon\` (premium dark).
- **Technical / engineering:** \`dark\` or \`ocean\`.

## Critical rules

- Never re-render the markdown content yourself — the renderer is the
  single source of truth for the live look.
- The page has a theme dropdown built in. Switching themes does NOT
  require re-running this prompt — only re-run it if the markdown
  changes, the port needs to change, or the renderer was stopped.
- Don't include screenshots or summaries in your reply — the URL is
  the deliverable. Keep the message short.
`.trim(),
            },
          },
        ],
      };
    },
  );
}
