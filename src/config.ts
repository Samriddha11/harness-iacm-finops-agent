import * as z from "zod/v4";

/**
 * Extract the account ID from a Harness PAT token.
 * PAT format: pat.<accountId>.<tokenId>.<secret>
 */
export function extractAccountIdFromToken(apiKey: string): string | undefined {
  const parts = apiKey.split(".");
  const accountId = parts[1];
  if (parts.length >= 3 && parts[0] === "pat" && accountId && accountId.length > 0) {
    return accountId;
  }
  return undefined;
}

/**
 * Global (process-wide) config schema. Auth fields are optional here — they
 * act as fallback defaults that may be overridden per-session via HTTP headers.
 */
const GlobalConfigSchema = z
  .object({
    /** PAT / service account token for Harness APIs (`x-api-key`). */
    HARNESS_API_KEY: z.string().optional(),
    /** Bearer/session JWT. Overridable per-session via X-Harness-Token header. */
    HARNESS_BEARER_TOKEN: z.string().optional(),
    /**
     * Raw `Cookie:` header value (e.g. copied from browser DevTools while
     * logged into the Harness UI). Used as a last-resort auth fallback when
     * neither HARNESS_API_KEY nor HARNESS_BEARER_TOKEN is set. The full string
     * is forwarded verbatim as the `Cookie` header on every outbound request.
     */
    HARNESS_HEADER_COOKIE: z.string().optional(),
    HARNESS_ACCOUNT_ID: z.string().optional(),
    HARNESS_BASE_URL: z.string().url().default("https://app.harness.io"),
    HARNESS_DEFAULT_ORG_ID: z.string().default("default"),
    HARNESS_DEFAULT_PROJECT_ID: z.string().optional(),
    HARNESS_API_TIMEOUT_MS: z.coerce.number().default(30000),
    HARNESS_MAX_RETRIES: z.coerce.number().default(3),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    HARNESS_TOOLSETS: z.string().optional(),
    HARNESS_MAX_BODY_SIZE_MB: z.coerce.number().default(10),
    HARNESS_RATE_LIMIT_RPS: z.coerce.number().default(10),
    /** When true, block all write operations (create/update/delete/run). */
    HARNESS_READ_ONLY: z.coerce.boolean().default(false),
  })
  .transform((data) => ({
    ...data,
    HARNESS_API_KEY: data.HARNESS_API_KEY?.trim() || undefined,
    HARNESS_BEARER_TOKEN: data.HARNESS_BEARER_TOKEN?.trim() || undefined,
    HARNESS_HEADER_COOKIE: data.HARNESS_HEADER_COOKIE?.trim() || undefined,
    HARNESS_ACCOUNT_ID: data.HARNESS_ACCOUNT_ID?.trim() || undefined,
  }));

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;

/**
 * Auth-related fields that can be overridden per-session via HTTP headers.
 */
export interface SessionAuthOverrides {
  HARNESS_API_KEY?: string;
  HARNESS_BEARER_TOKEN?: string;
  HARNESS_HEADER_COOKIE?: string;
  HARNESS_ACCOUNT_ID?: string;
  HARNESS_BASE_URL?: string;
  HARNESS_DEFAULT_ORG_ID?: string;
  HARNESS_DEFAULT_PROJECT_ID?: string;
}

/**
 * The effective per-session config — all fields resolved, ready for
 * HarnessClient and Registry construction.
 */
export type Config = Omit<
  GlobalConfig,
  | "HARNESS_API_KEY"
  | "HARNESS_BEARER_TOKEN"
  | "HARNESS_HEADER_COOKIE"
  | "HARNESS_ACCOUNT_ID"
  | "HARNESS_BASE_URL"
  | "HARNESS_DEFAULT_ORG_ID"
  | "HARNESS_DEFAULT_PROJECT_ID"
> & {
  HARNESS_API_KEY?: string;
  HARNESS_BEARER_TOKEN?: string;
  HARNESS_HEADER_COOKIE?: string;
  HARNESS_ACCOUNT_ID: string;
  HARNESS_BASE_URL: string;
  HARNESS_DEFAULT_ORG_ID: string;
  HARNESS_DEFAULT_PROJECT_ID?: string;
};

/**
 * Thrown by `buildSessionConfig` when the merged auth context is incomplete.
 */
export class SessionAuthError extends Error {
  readonly missing: string[];
  constructor(message: string, missing: string[]) {
    super(message);
    this.name = "SessionAuthError";
    this.missing = missing;
  }
}

/** Load process-wide config from environment. */
export function loadGlobalConfig(): GlobalConfig {
  const result = GlobalConfigSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid configuration:\n${issues}`);
  }
  return result.data;
}

function clean(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Merge per-session auth overrides on top of global env defaults and validate
 * that the result has at least one auth method and an account ID.
 */
export function buildSessionConfig(
  global: GlobalConfig,
  overrides: SessionAuthOverrides,
): Config {
  const apiKey = clean(overrides.HARNESS_API_KEY) ?? global.HARNESS_API_KEY;
  const bearerToken = clean(overrides.HARNESS_BEARER_TOKEN) ?? global.HARNESS_BEARER_TOKEN;
  const headerCookie = clean(overrides.HARNESS_HEADER_COOKIE) ?? global.HARNESS_HEADER_COOKIE;
  const baseUrl = clean(overrides.HARNESS_BASE_URL) ?? global.HARNESS_BASE_URL;
  const defaultOrgId = clean(overrides.HARNESS_DEFAULT_ORG_ID) ?? global.HARNESS_DEFAULT_ORG_ID;
  const defaultProjectId = clean(overrides.HARNESS_DEFAULT_PROJECT_ID) ?? global.HARNESS_DEFAULT_PROJECT_ID;

  const explicitAccountId = clean(overrides.HARNESS_ACCOUNT_ID) ?? global.HARNESS_ACCOUNT_ID;
  const accountId = explicitAccountId ?? (apiKey ? extractAccountIdFromToken(apiKey) : undefined);

  const missing: string[] = [];
  if (!apiKey && !bearerToken && !headerCookie) {
    missing.push(
      "auth (one of X-Harness-Api-Key, X-Harness-Token, or X-Harness-Cookie; or set HARNESS_API_KEY / HARNESS_BEARER_TOKEN / HARNESS_HEADER_COOKIE in .env)",
    );
  }
  if (!accountId) {
    missing.push(
      "account (X-Harness-Account header, or HARNESS_ACCOUNT_ID in .env, or a PAT api key in the form pat.<accountId>.<tokenId>.<secret>)",
    );
  }

  if (missing.length > 0) {
    throw new SessionAuthError(
      `Missing required Harness credentials: ${missing.join("; ")}`,
      missing,
    );
  }

  return {
    HARNESS_API_KEY: apiKey,
    HARNESS_BEARER_TOKEN: bearerToken,
    HARNESS_HEADER_COOKIE: headerCookie,
    HARNESS_ACCOUNT_ID: accountId!,
    HARNESS_BASE_URL: baseUrl,
    HARNESS_DEFAULT_ORG_ID: defaultOrgId,
    HARNESS_DEFAULT_PROJECT_ID: defaultProjectId,
    HARNESS_API_TIMEOUT_MS: global.HARNESS_API_TIMEOUT_MS,
    HARNESS_MAX_RETRIES: global.HARNESS_MAX_RETRIES,
    LOG_LEVEL: global.LOG_LEVEL,
    HARNESS_TOOLSETS: global.HARNESS_TOOLSETS,
    HARNESS_MAX_BODY_SIZE_MB: global.HARNESS_MAX_BODY_SIZE_MB,
    HARNESS_RATE_LIMIT_RPS: global.HARNESS_RATE_LIMIT_RPS,
    HARNESS_READ_ONLY: global.HARNESS_READ_ONLY,
  };
}
