/**
 * Core types for the IACM resource registry and dispatch system.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ToolsetName = "iacm";

export type OperationName = "list" | "get" | "create";

/**
 * Lightweight field descriptor for body schemas.
 */
export interface BodyFieldSpec {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  description: string;
  fields?: BodyFieldSpec[];
  enum?: string[];
}

export interface BodySchema {
  description: string;
  fields: BodyFieldSpec[];
}

export interface FilterFieldSpec {
  name: string;
  description: string;
  type?: "string" | "number" | "boolean";
  enum?: string[];
}

export interface EndpointSpec {
  method: HttpMethod;
  path: string;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  bodyBuilder?: (input: Record<string, unknown>) => unknown;
  headers?: Record<string, string>;
  responseExtractor?: (raw: unknown) => unknown;
  description?: string;
  bodySchema?: BodySchema;
}

export interface ResourceDefinition {
  resourceType: string;
  displayName: string;
  description: string;
  toolset: ToolsetName;
  scope: "project" | "org" | "account";
  identifierFields: string[];
  listFilterFields?: FilterFieldSpec[];
  deepLinkTemplate?: string;
  diagnosticHint?: string;
  /**
   * Page numbering base for this resource's API.
   * - 1 → IaCM workspace API (page >= 1, default 1)
   * - 0 → Harness pipeline/NG APIs (page >= 0, default 0)
   * Defaults to 0 when omitted.
   */
  paginationBase?: 0 | 1;
  operations: Partial<Record<OperationName, EndpointSpec>>;
}

export interface ToolsetDefinition {
  name: ToolsetName;
  displayName: string;
  description: string;
  resources: ResourceDefinition[];
}
