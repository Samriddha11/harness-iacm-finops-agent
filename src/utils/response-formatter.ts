/**
 * Standard MCP response formatters.
 * Uses compact JSON (no indentation) to minimize token count for LLM consumers.
 */

export type ToolContentPart =
  | { type: "text"; text: string };

export interface ToolResult {
  [key: string]: unknown;
  content: ToolContentPart[];
  isError?: boolean;
}

export function jsonResult(data: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

export function errorResult(message: string): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}
