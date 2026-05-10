import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerOpaAnalysisPrompt } from "./opa-analysis.js";
import { registerIacmBvrPrompt } from "./iacm-bvr.js";

export function registerAllPrompts(server: McpServer): void {
  registerOpaAnalysisPrompt(server);
  registerIacmBvrPrompt(server);
}
