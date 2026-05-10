import type { Config } from "../config.js";
import type { RequestOptions } from "./types.js";
import { HarnessApiError } from "../utils/errors.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("harness-client");

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const BASE_BACKOFF_MS = 1000;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function humanizeHttpError(status: number, rawBody: string): string {
  const isHtml = /^\s*</.test(rawBody);
  const hint = isHtml ? stripHtml(rawBody).slice(0, 120) : rawBody.slice(0, 200);

  switch (status) {
    case 401:
      return `HTTP 401 Unauthorized — invalid or expired credentials. Use HARNESS_API_KEY (PAT/SA token) or HARNESS_BEARER_TOKEN.${hint ? ` (${hint})` : ""}`;
    case 403:
      return `HTTP 403 Forbidden — access denied. Check HARNESS_ACCOUNT_ID, RBAC permissions for IaCM module, and that the IaCM module is enabled.${hint ? ` (${hint})` : ""}`;
    case 404:
      return `HTTP 404 Not Found — the workspace, run, or resource does not exist. Verify org, project, and identifier values.${hint ? ` (${hint})` : ""}`;
    default:
      return `HTTP ${status}: ${hint || "empty response"}`;
  }
}

export class HarnessClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly bearerToken: string | undefined;
  private readonly accountId: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly rateLimiter: RateLimiter;

  constructor(config: Config) {
    this.baseUrl = config.HARNESS_BASE_URL.replace(/\/$/, "");
    this.apiKey = config.HARNESS_API_KEY;
    this.bearerToken = config.HARNESS_BEARER_TOKEN;
    this.accountId = config.HARNESS_ACCOUNT_ID;
    this.timeout = config.HARNESS_API_TIMEOUT_MS;
    this.maxRetries = config.HARNESS_MAX_RETRIES;
    this.rateLimiter = new RateLimiter(config.HARNESS_RATE_LIMIT_RPS);
  }

  get account(): string {
    return this.accountId;
  }

  get baseUrlPublic(): string {
    return this.baseUrl;
  }

  get authMethod(): "bearer" | "apiKey" | "none" {
    if (this.bearerToken) return "bearer";
    if (this.apiKey) return "apiKey";
    return "none";
  }

  async request<T>(options: RequestOptions): Promise<T> {
    await this.rateLimiter.acquire();

    const method = options.method ?? "GET";
    const path = options.path;
    const requestWallStart = performance.now();
    const url = this.buildUrl(options);

    const headers: Record<string, string> = {
      "Harness-Account": this.accountId,
      ...options.headers,
    };

    // Auth header selection: PAT/SA key preferred; fall back to bearer token.
    if (this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    } else if (this.bearerToken) {
      headers["Authorization"] = `Bearer ${this.bearerToken}`;
    } else {
      throw new HarnessApiError(
        "No Harness credentials available. Provide HARNESS_API_KEY or HARNESS_BEARER_TOKEN.",
        400,
      );
    }

    if (options.body) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5);
        log.debug(`Retry attempt ${attempt}/${this.maxRetries}`, { backoffMs: Math.round(backoff) });
        await new Promise((r) => setTimeout(r, backoff));
      }

      const attemptStart = performance.now();

      try {
        if (options.signal?.aborted) {
          throw options.signal.reason ?? new DOMException("The operation was aborted", "AbortError");
        }

        const timeoutController = new AbortController();
        const timer = setTimeout(() => timeoutController.abort(), this.timeout);
        const signal = options.signal
          ? AbortSignal.any([options.signal, timeoutController.signal])
          : timeoutController.signal;

        const bodyString = options.body
          ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body))
          : undefined;

        log.info("Harness API request", { method, path, url });

        const response = await fetch(url, {
          method,
          headers,
          body: bodyString,
          signal,
        });

        clearTimeout(timer);

        const attemptDurationMs = Math.round(performance.now() - attemptStart);
        const totalDurationMs = Math.round(performance.now() - requestWallStart);

        if (!response.ok) {
          const body = await response.text();
          let parsed: { message?: string; code?: string; correlationId?: string } = {};
          try {
            parsed = JSON.parse(body);
          } catch {
            // Non-JSON error body
          }

          const message = parsed.message ?? humanizeHttpError(response.status, body);
          const error = new HarnessApiError(
            message,
            response.status,
            parsed.code,
            parsed.correlationId,
          );

          const willRetry = RETRYABLE_STATUS_CODES.has(response.status) && attempt < this.maxRetries;
          log.info("Harness API response", {
            outcome: willRetry ? "http_error_will_retry" : "http_error",
            method, path, httpStatus: response.status,
            attemptDurationMs, totalDurationMs,
            attempt: attempt + 1, maxAttempts: this.maxRetries + 1,
          });

          if (willRetry) {
            lastError = error;
            continue;
          }
          throw error;
        }

        const text = await response.text();
        const readDurationMs = Math.round(performance.now() - attemptStart);
        const totalMsAfterRead = Math.round(performance.now() - requestWallStart);

        if (!text) {
          throw new HarnessApiError(`Empty response body from ${method} ${path}`, 502);
        }

        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          throw new HarnessApiError(
            `Non-JSON response from ${method} ${path}: ${text.slice(0, 200)}`,
            502, undefined, undefined, parseErr,
          );
        }

        log.info("Harness API response", {
          outcome: "success", method, path,
          attemptDurationMs: readDurationMs, totalDurationMs: totalMsAfterRead,
          attempt: attempt + 1, responseBytes: text.length,
        });
        log.debug("Response body", { body: text.slice(0, 1000) });
        return data as T;
      } catch (err) {
        if (err instanceof HarnessApiError) throw err;
        if (err instanceof Error && err.name === "AbortError") {
          const attemptDurationMs = Math.round(performance.now() - attemptStart);
          const totalDurationMs = Math.round(performance.now() - requestWallStart);
          if (options.signal?.aborted) {
            log.info("Harness API response", { outcome: "error", reason: "aborted", method, path, attemptDurationMs, totalDurationMs, attempt: attempt + 1 });
            throw new HarnessApiError("Request cancelled", 499, undefined, undefined, err);
          }
          lastError = new HarnessApiError("Request timed out", 408, undefined, undefined, err);
          const willRetryTimeout = attempt < this.maxRetries;
          log.warn("Harness API request timed out", { outcome: willRetryTimeout ? "timeout_will_retry" : "timeout", method, path, attemptDurationMs, totalDurationMs, attempt: attempt + 1, maxAttempts: this.maxRetries + 1 });
          if (willRetryTimeout) continue;
          throw lastError;
        }
        throw new HarnessApiError(
          `Request failed: ${(err as Error).message ?? String(err)}`,
          502, undefined, undefined, err,
        );
      }
    }

    throw lastError ?? new HarnessApiError("Max retries exceeded", 500);
  }

  private buildUrl(options: RequestOptions): string {
    let path = options.path;

    if (this.baseUrl.endsWith("/gateway") && path.startsWith("/gateway/")) {
      path = path.slice("/gateway".length);
    }

    const params = new URLSearchParams();
    params.set("accountIdentifier", this.accountId);

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== "") {
          params.set(key, String(value));
        }
      }
    }

    return `${this.baseUrl}${path}?${params.toString()}`;
  }
}
