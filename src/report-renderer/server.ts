import { createServer, type Server } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, dirname, join } from "node:path";
import { createLogger } from "../utils/logger.js";
import { THEMES, buildThemeStyleTag, type ThemeId } from "./themes.js";
import { parseFrontMatter, markdownToHtml } from "./markdown-to-html.js";

const log = createLogger("report-renderer");

const THEME_IDS = Object.keys(THEMES) as ThemeId[];

interface RegisteredReport {
  markdownPath: string;
  defaultTheme: ThemeId;
}

const reports = new Map<string, RegisteredReport>();
let httpServer: Server | null = null;
let boundPort = 0;

export function registerReport(id: string, markdownPath: string, defaultTheme: ThemeId): void {
  reports.set(id, { markdownPath, defaultTheme });
}

export function getReportUrl(id: string): string {
  return `http://localhost:${boundPort}/report/${id}`;
}

function buildPage(report: RegisteredReport, themeId: ThemeId): string {
  const content = readFileSync(report.markdownPath, "utf-8");
  const { fm, body } = parseFrontMatter(content);
  const htmlBody = markdownToHtml(body);

  const themeOptions = THEME_IDS.map((id) =>
    `<option value="${id}" ${id === themeId ? "selected" : ""}>${THEMES[id]!.label}</option>`,
  ).join("");

  const metaItem = (label: string, value: string) =>
    `<div class="cover-meta-item"><span class="cover-meta-label">${label}</span><span class="cover-meta-value">${value}</span></div>`;

  const coverMeta = [
    fm.customer       ? metaItem("Account",        fm.customer.replace("Account: ", ""))  : "",
    fm.date           ? metaItem("Date",            fm.date)           : "",
    fm.author         ? metaItem("Prepared By",     fm.author)         : "",
    fm.classification ? metaItem("Classification",  fm.classification) : "",
  ].filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="en" data-theme="${themeId}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${fm.title ?? "IaCM Report"}</title>
${buildThemeStyleTag(themeId)}
<style>body{--theme-id:"${themeId}";}</style>
</head>
<body data-theme="${themeId}">

<!-- Navigation -->
<nav class="report-nav">
  <div class="nav-brand"><span class="dot"></span>Harness IaCM</div>
  <div class="nav-right">
    <span class="nav-label">Theme</span>
    <select class="theme-select" onchange="switchTheme(this.value)">
      ${themeOptions}
    </select>
    <button class="btn-pdf" onclick="window.print()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
      </svg>
      Download PDF
    </button>
  </div>
</nav>

<!-- Cover -->
<div class="cover">
  <div class="cover-brand">H A R N E S S</div>
  <div class="cover-eyebrow">${fm.docType ?? "Report"}</div>
  <h1>${fm.title ?? "IaCM Report"}</h1>
  ${fm.subtitle ? `<div class="cover-subtitle">${fm.subtitle}</div>` : ""}
  <div class="cover-divider"></div>
  <div class="cover-meta">${coverMeta}</div>
</div>

<!-- Body -->
<div class="report-body">
${htmlBody}
</div>

<script>
  // Propagate data-theme to body so body[data-theme="X"] CSS selectors work
  document.body.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'harness');

  function switchTheme(themeId) {
    window.location.href = window.location.pathname + '?theme=' + themeId;
  }

  // Keyboard shortcut: Ctrl/Cmd+P = print (PDF)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      window.print();
    }
  });
</script>
</body>
</html>`;
}

function mimeType(ext: string): string {
  const map: Record<string, string> = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
    ".css": "text/css", ".js": "application/javascript",
  };
  return map[ext] ?? "application/octet-stream";
}

export function startReportServer(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    if (httpServer) {
      resolve(boundPort);
      return;
    }

    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const pathname = url.pathname;

      // GET /report/:id[?theme=...]
      const reportMatch = pathname.match(/^\/report\/([^/]+)$/);
      if (reportMatch) {
        const id = reportMatch[1]!;
        const report = reports.get(id);
        if (!report) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Report not found");
          return;
        }

        const rawTheme = url.searchParams.get("theme") ?? report.defaultTheme;
        const theme = (THEME_IDS.includes(rawTheme as ThemeId) ? rawTheme : report.defaultTheme) as ThemeId;

        try {
          const html = buildPage(report, theme);
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(html);
        } catch (err) {
          log.error("Error rendering report", { id, error: String(err) });
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end(`Render error: ${(err as Error).message}`);
        }
        return;
      }

      // Static assets (images, etc.) relative to any registered report's directory
      // GET /report/:id/assets/...
      const assetMatch = pathname.match(/^\/report\/([^/]+)\/(.+)$/);
      if (assetMatch) {
        const id = assetMatch[1]!;
        const assetPath = assetMatch[2]!;
        const report = reports.get(id);
        if (report) {
          const fullPath = join(dirname(report.markdownPath), assetPath);
          if (existsSync(fullPath)) {
            const ext = extname(fullPath).toLowerCase();
            res.writeHead(200, { "Content-Type": mimeType(ext) });
            res.end(readFileSync(fullPath));
            return;
          }
        }
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Asset not found");
        return;
      }

      // Index: list all reports
      if (pathname === "/" || pathname === "") {
        const items = [...reports.entries()].map(([id, r]) =>
          `<li><a href="/report/${id}">${id}</a> — <small>${r.markdownPath}</small></li>`,
        ).join("\n");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!DOCTYPE html><html><head><title>IaCM Reports</title></head><body>
          <h2 style="font-family:sans-serif;padding:24px">IaCM Reports</h2>
          <ul style="font-family:sans-serif;padding:0 24px">${items || "<li>No reports registered yet.</li>"}</ul>
        </body></html>`);
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    });

    server.listen(port, "127.0.0.1", () => {
      httpServer = server;
      boundPort = (server.address() as { port: number }).port;
      log.info(`Report renderer listening on http://127.0.0.1:${boundPort}`);
      resolve(boundPort);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        // Port taken — try next port
        server.listen(0, "127.0.0.1");
      } else {
        reject(err);
      }
    });
  });
}

export function stopReportServer(): void {
  if (httpServer) {
    httpServer.close();
    httpServer = null;
    boundPort = 0;
  }
}
