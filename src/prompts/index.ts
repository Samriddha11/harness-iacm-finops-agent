import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerOpaAnalysisPrompt } from "./opa-analysis.js";
import { registerIacmBvrPrompt } from "./iacm-bvr.js";
import { registerQuickChartPrompt } from "./iacm-quick-chart.js";
import { registerMaturityCheckPrompt } from "./iacm-maturity-check.js";
import { registerQuickWinsPrompt } from "./iacm-quick-wins.js";
import { registerRenderPrompt } from "./iacm-render.js";
import { registerGrowthPrompt } from "./iacm-growth.js";

export function registerAllPrompts(server: McpServer): void {
  registerOpaAnalysisPrompt(server);
  registerIacmBvrPrompt(server);
  registerQuickChartPrompt(server);
  registerMaturityCheckPrompt(server);
  registerQuickWinsPrompt(server);
  registerRenderPrompt(server);
  registerGrowthPrompt(server);
}
