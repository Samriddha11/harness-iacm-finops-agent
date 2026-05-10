/**
 * Compact item utility — strips verbose metadata from list results,
 * keeping only fields that are actionable for an LLM.
 */

const TIMESTAMP_PATTERN = /(?:At|Ts|Time|Date|_at|_ts)$/i;

const IDENTITY_FIELDS = new Set([
  "identifier", "id", "name", "displayName", "description", "slug",
]);

const STATUS_FIELDS = new Set([
  "status", "state", "enabled", "health", "provisioner", "provisioner_version",
  "type", "kind",
]);

const OWNERSHIP_FIELDS = new Set([
  "tags", "owner", "org", "project", "account",
  "repository", "repository_branch", "repository_path",
  "provider_connector", "repository_connector",
]);

const ALWAYS_KEEP = new Set(["openInHarness"]);

const IDENTIFIER_PATTERN = /(?:Identifier|Id|_id)$/;

function isWhitelistedKey(key: string): boolean {
  return (
    IDENTITY_FIELDS.has(key) ||
    STATUS_FIELDS.has(key) ||
    OWNERSHIP_FIELDS.has(key) ||
    ALWAYS_KEEP.has(key) ||
    TIMESTAMP_PATTERN.test(key) ||
    IDENTIFIER_PATTERN.test(key)
  );
}

export function compactItems(items: unknown[]): unknown[] {
  return items.map((item) => {
    if (typeof item !== "object" || item === null) return item;
    const full = item as Record<string, unknown>;
    const slim: Record<string, unknown> = {};
    for (const key of Object.keys(full)) {
      if (isWhitelistedKey(key)) {
        slim[key] = full[key];
      }
    }

    if (typeof slim.openInHarness === "string" && typeof slim.name === "string") {
      slim.name = `[${slim.name}](${slim.openInHarness})`;
      delete slim.openInHarness;
    }

    return slim;
  });
}
