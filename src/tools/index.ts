import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Registry } from "../registry/index.js";
import type { HarnessClient } from "../client/harness-client.js";
import type { Config } from "../config.js";

import { registerListTool } from "./harness-iacm-list.js";
import { registerGetTool } from "./harness-iacm-get.js";
import { registerDescribeTool } from "./harness-iacm-describe.js";
import { registerRunTool } from "./harness-iacm-run.js";
import { registerScanTool } from "./harness-iacm-scan.js";
import { registerFeatureScanTool } from "./harness-iacm-feature-scan.js";
import { registerOpaScanTool } from "./harness-iacm-opa-scan.js";
import { registerMarkdownToPdfTool } from "./markdown-to-pdf.js";
import { registerRenderTool } from "./harness-iacm-render.js";
import { registerMaturityTool } from "./harness-iacm-maturity.js";
import { registerGuideTool } from "./harness-iacm-guide.js";
import { registerChartTool } from "./harness-iacm-chart.js";

export function registerAllTools(
  server: McpServer,
  registry: Registry,
  client: HarnessClient,
  config: Config,
): void {
  registerListTool(server, registry, client);
  registerGetTool(server, registry, client);
  registerRunTool(server, registry, client, config);
  registerScanTool(server, client);
  registerFeatureScanTool(server, client);
  registerOpaScanTool(server, client);
  registerMarkdownToPdfTool(server);
  registerRenderTool(server);
  registerChartTool(server);
  registerMaturityTool(server, client);
  registerDescribeTool(server, registry);
  registerGuideTool(server);
}
