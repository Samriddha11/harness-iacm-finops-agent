import type { Config } from "../config.js";
import type { HarnessClient } from "../client/harness-client.js";
import type {
  ResourceDefinition,
  ToolsetDefinition,
  ToolsetName,
  OperationName,
  EndpointSpec,
  FilterFieldSpec,
} from "./types.js";
import { createLogger } from "../utils/logger.js";

import { iacmToolset } from "./toolsets/iacm.js";

const log = createLogger("registry");

const ALL_TOOLSETS: ToolsetDefinition[] = [iacmToolset];

export class Registry {
  private resourceMap: Map<string, ResourceDefinition> = new Map();
  private toolsets: ToolsetDefinition[] = [];

  constructor(private config: Config) {
    const enabledNames = this.parseToolsetFilter();
    this.toolsets = enabledNames
      ? ALL_TOOLSETS.filter((t) => enabledNames.has(t.name))
      : ALL_TOOLSETS;

    for (const toolset of this.toolsets) {
      for (const resource of toolset.resources) {
        this.resourceMap.set(resource.resourceType, resource);
      }
    }

    log.info(`Registry loaded: ${this.resourceMap.size} resource types from ${this.toolsets.length} toolsets`);
  }

  private parseToolsetFilter(): Set<ToolsetName> | null {
    const raw = this.config.HARNESS_TOOLSETS;
    if (!raw || raw.trim() === "") return null;

    const validNames = new Set<string>(ALL_TOOLSETS.map((t) => t.name));
    const parsed = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const valid: ToolsetName[] = [];
    const invalid: string[] = [];

    for (const name of parsed) {
      if (validNames.has(name)) {
        valid.push(name as ToolsetName);
      } else {
        invalid.push(name);
      }
    }

    if (invalid.length > 0) {
      const available = Array.from(validNames).sort().join(", ");
      throw new Error(
        `Invalid HARNESS_TOOLSETS: ${invalid.map((n) => `"${n}"`).join(", ")}. ` +
        `Valid toolset names: ${available}`,
      );
    }

    if (valid.length === 0) return null;
    return new Set(valid);
  }

  get defaultOrgId(): string { return this.config.HARNESS_DEFAULT_ORG_ID; }
  get defaultProjectId(): string | undefined { return this.config.HARNESS_DEFAULT_PROJECT_ID; }

  getResource(resourceType: string): ResourceDefinition {
    const def = this.resourceMap.get(resourceType);
    if (!def) {
      const available = Array.from(this.resourceMap.keys()).sort().join(", ");
      throw new Error(`Unknown resource_type "${resourceType}". Available: ${available}`);
    }
    return def;
  }

  getAllResourceTypes(): string[] {
    return Array.from(this.resourceMap.keys()).sort();
  }

  getAllFilterFields(): FilterFieldSpec[] {
    const seen = new Set<string>();
    const fields: FilterFieldSpec[] = [];
    for (const [, def] of this.resourceMap) {
      for (const f of def.listFilterFields ?? []) {
        if (!seen.has(f.name)) {
          seen.add(f.name);
          fields.push(f);
        }
      }
    }
    return fields;
  }

  getAllToolsets(): ToolsetDefinition[] {
    return this.toolsets;
  }

  supportsOperation(resourceType: string, operation: OperationName): boolean {
    const def = this.resourceMap.get(resourceType);
    return def?.operations[operation] !== undefined;
  }

  private static readonly READ_OPERATIONS: Set<OperationName> = new Set(["list", "get"]);

  async dispatch(
    client: HarnessClient,
    resourceType: string,
    operation: OperationName,
    input: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<unknown> {
    if (this.config.HARNESS_READ_ONLY && !Registry.READ_OPERATIONS.has(operation)) {
      throw new Error(
        `Read-only mode is enabled (HARNESS_READ_ONLY=true). "${operation}" operations are not allowed.`,
      );
    }

    const def = this.getResource(resourceType);
    const spec = def.operations[operation];
    if (!spec) {
      const supported = Object.keys(def.operations).join(", ");
      throw new Error(
        `Resource "${resourceType}" does not support "${operation}". Supported: ${supported}`,
      );
    }

    return this.executeSpec(client, def, spec, input, signal);
  }

  private async executeSpec(
    client: HarnessClient,
    def: ResourceDefinition,
    spec: EndpointSpec,
    input: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<unknown> {
    // Build path with substitutions
    let path = spec.path;
    if (spec.pathParams) {
      for (const [inputKey, pathPlaceholder] of Object.entries(spec.pathParams)) {
        let value = input[inputKey];
        if (value === undefined || value === "") {
          // Auto-fill known placeholders from config defaults
          if (pathPlaceholder === "accountId") {
            value = this.config.HARNESS_ACCOUNT_ID;
          } else if (pathPlaceholder === "org" && (def.scope === "project" || def.scope === "org")) {
            value = this.config.HARNESS_DEFAULT_ORG_ID;
          } else if (pathPlaceholder === "project" && def.scope === "project") {
            value = this.config.HARNESS_DEFAULT_PROJECT_ID;
          }
        }
        if (value === undefined || value === "") {
          throw new Error(
            `Missing required field "${inputKey}" for path parameter "{${pathPlaceholder}}". ` +
            `Provide it explicitly or set HARNESS_DEFAULT_${pathPlaceholder.toUpperCase()}_ID in .env.`,
          );
        }
        path = path.replace(`{${pathPlaceholder}}`, encodeURIComponent(String(value)));
      }
    }

    // Build query params
    const params: Record<string, string | number | boolean | undefined> = {};

    // For Harness NG/pipeline API paths (not /iacm/api/ paths), inject
    // orgIdentifier and projectIdentifier as query params (the NG API convention).
    const isNgPath = !spec.path.startsWith("/iacm/");
    if (isNgPath && (def.scope === "project" || def.scope === "org")) {
      const orgId = (input.org_id as string | undefined) ?? this.config.HARNESS_DEFAULT_ORG_ID;
      if (orgId) params.orgIdentifier = orgId;
    }
    if (isNgPath && def.scope === "project") {
      const projectId = (input.project_id as string | undefined) ?? this.config.HARNESS_DEFAULT_PROJECT_ID;
      if (projectId) params.projectIdentifier = projectId;
    }

    // IaCM API paths require routingId (same account ID) for proper gateway routing.
    if (spec.path.startsWith("/iacm/")) {
      params.routingId = this.config.HARNESS_ACCOUNT_ID;
    }

    if (spec.queryParams) {
      for (const [inputKey, queryKey] of Object.entries(spec.queryParams)) {
        const value = input[inputKey];
        if (value !== undefined && value !== "") {
          params[queryKey] = value as string | number | boolean;
        }
      }
    }

    // Build body
    const body = spec.bodyBuilder ? spec.bodyBuilder(input) : undefined;

    // Make request
    const raw = await client.request({
      method: spec.method,
      path,
      params,
      body,
      ...(spec.headers ? { headers: spec.headers } : {}),
      signal,
    });

    // Extract response
    const result = spec.responseExtractor ? spec.responseExtractor(raw) : raw;
    return result;
  }

  describe(): Record<string, unknown> {
    const toolsets: Record<string, unknown> = {};
    for (const ts of this.toolsets) {
      toolsets[ts.name] = {
        displayName: ts.displayName,
        description: ts.description,
        resources: ts.resources.map((r) => ({
          resource_type: r.resourceType,
          displayName: r.displayName,
          description: r.description,
          scope: r.scope,
          operations: Object.entries(r.operations).map(([op, spec]) => ({
            operation: op,
            method: spec.method,
            description: spec.description,
            bodySchema: spec.bodySchema ?? undefined,
          })),
          identifierFields: r.identifierFields,
          listFilterFields: r.listFilterFields,
          diagnosticHint: r.diagnosticHint ?? undefined,
        })),
      };
    }
    return {
      total_resource_types: this.resourceMap.size,
      total_toolsets: this.toolsets.length,
      toolsets,
    };
  }

  searchResources(
    query: string,
  ): Array<{ type: string; name: string; toolset: string; ops: string[]; description: string }> {
    const q = query.toLowerCase();
    const results: Array<{
      type: string; name: string; toolset: string; ops: string[]; description: string; score: number
    }> = [];

    for (const def of this.resourceMap.values()) {
      let score = 0;
      const toolsetName = this.toolsets.find((t) => t.resources.includes(def))?.name ?? "";

      if (def.resourceType.toLowerCase() === q) score = 100;
      else if (def.resourceType.toLowerCase().includes(q)) score = 80;
      else if (def.displayName.toLowerCase().includes(q)) score = 60;
      else if (toolsetName.toLowerCase().includes(q)) score = 40;
      else if (def.description.toLowerCase().includes(q)) score = 20;

      if (score > 0) {
        results.push({
          type: def.resourceType,
          name: def.displayName,
          toolset: toolsetName,
          ops: Object.keys(def.operations),
          description: def.description,
          score,
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...rest }) => rest);
  }

  describeSummary(): Record<string, unknown> {
    const resource_types = [];
    for (const ts of this.toolsets) {
      for (const r of ts.resources) {
        const ops = Object.keys(r.operations);
        resource_types.push({
          type: r.resourceType,
          name: r.displayName,
          toolset: ts.name,
          ops,
        });
      }
    }
    return {
      total_resource_types: this.resourceMap.size,
      total_toolsets: this.toolsets.length,
      resource_types,
      hint: "Call harness_iacm_describe(resource_type='<type>') for full details including filter fields and diagnosticHint.",
    };
  }
}
