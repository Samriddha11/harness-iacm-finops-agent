import * as z from "zod/v4";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { errorResult, jsonResult } from "../utils/response-formatter.js";

// Colour palette matching Harness brand
const COLOURS = {
  harness: "#0278D5",
  dark: "#1A1A2E",
  text: "#2D2D2D",
  muted: "#6B7280",
  border: "#E5E7EB",
  critical: "#DC2626",
  risk: "#D97706",
  warning: "#F59E0B",
  success: "#059669",
  info: "#2563EB",
  action: "#7C3AED",
  positive: "#059669",
  neutral: "#6B7280",
  negative: "#DC2626",
  bg_light: "#F9FAFB",
};

interface PdfKitDoc {
  fontSize(size: number): this;
  fillColor(color: string): this;
  font(font: string): this;
  text(text: string, options?: Record<string, unknown>): this;
  text(text: string, x: number, y: number, options?: Record<string, unknown>): this;
  moveDown(lines?: number): this;
  moveTo(x: number, y: number): this;
  lineTo(x: number, y: number): this;
  stroke(): this;
  strokeColor(color: string): this;
  lineWidth(width: number): this;
  rect(x: number, y: number, w: number, h: number): this;
  fill(color?: string): this;
  addPage(): this;
  end(): void;
  on(event: string, cb: (...args: unknown[]) => void): this;
  page: { width: number; height: number; margins: { top: number; left: number; right: number; bottom: number } };
  y: number;
  x: number;
  image(path: string, options?: Record<string, unknown>): this;
  list(items: string[], options?: Record<string, unknown>): this;
  table?: (table: unknown, options?: unknown) => void;
}

function renderMarkdownToPdf(markdownPath: string, outputPath: string): Promise<void> {
  return new Promise(async (resolve: () => void, reject) => {
    try {
      const PDFDocument = (await import("pdfkit")).default as unknown as new (opts?: Record<string, unknown>) => PdfKitDoc;
      const { marked } = await import("marked");

      const content = readFileSync(markdownPath, "utf-8");
      const lines = content.split("\n");

      // Parse YAML frontmatter
      const frontmatter: Record<string, string> = {};
      let bodyStart = 0;
      if (lines[0] === "---") {
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === "---") { bodyStart = i + 1; break; }
          const [key, ...val] = (lines[i] ?? "").split(":");
          if (key) frontmatter[key.trim()] = val.join(":").trim().replace(/^"|"$/g, "");
        }
      }

      const bodyLines = lines.slice(bodyStart);
      const body = bodyLines.join("\n");

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 60, left: 60, right: 60, bottom: 60 },
        autoFirstPage: false,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: unknown) => chunks.push(chunk as Buffer));
      doc.on("end", () => {
        writeFileSync(outputPath, Buffer.concat(chunks));
        resolve();
      });
      doc.on("error", reject);

      const W = 595 - 120; // usable width

      // ── Cover page ────────────────────────────────────────────────────────
      doc.addPage();

      // Header bar
      doc.rect(0, 0, 595, 8).fill(COLOURS.harness);

      // Harness wordmark area
      doc.rect(60, 30, 8, 30).fill(COLOURS.harness);
      doc.fontSize(14).fillColor(COLOURS.harness).font("Helvetica-Bold").text("HARNESS", 76, 38);

      // Cover title block
      doc.rect(0, 100, 595, 4).fill(COLOURS.harness);
      doc.rect(0, 104, 595, 200).fill(COLOURS.dark);

      const title = frontmatter.title ?? "Business Value Review";
      const subtitle = frontmatter.subtitle ?? "";
      const customer = frontmatter.customer ?? "";
      const date = frontmatter.date ?? new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const docType = frontmatter.docType ?? "Report";

      doc.fontSize(9).fillColor("#9CA3AF").font("Helvetica").text(docType.toUpperCase(), 60, 130, { characterSpacing: 2 });
      doc.fontSize(26).fillColor("#FFFFFF").font("Helvetica-Bold").text(title, 60, 148, { width: W });
      doc.fontSize(13).fillColor("#93C5FD").font("Helvetica").text(subtitle, 60, doc.y + 6, { width: W });
      doc.rect(0, 308, 595, 1).fill("#374151");
      doc.fontSize(10).fillColor("#D1D5DB").font("Helvetica").text(customer, 60, 318);
      doc.fontSize(10).fillColor("#D1D5DB").text(date, 60, doc.y + 2);

      // Footer bar
      doc.rect(0, 827, 595, 8).fill(COLOURS.harness);

      // ── Content pages ─────────────────────────────────────────────────────
      doc.addPage();

      let pageNum = 2;
      const addPageFooter = () => {
        const y = 827 - 20;
        doc.fontSize(8).fillColor(COLOURS.muted).font("Helvetica")
          .text(`${frontmatter.title ?? "IaCM BVR"} · ${date} · CONFIDENTIAL`, 60, y, { width: W - 40 })
          .text(String(pageNum), 60, y, { width: W, align: "right" });
        pageNum++;
      };

      const newPage = () => {
        addPageFooter();
        doc.addPage();
      };

      const checkPageBreak = (needed = 60) => {
        if (doc.y > 827 - 60 - needed) newPage();
      };

      // Parse and render body
      const tokens = marked.lexer(body);

      for (const token of tokens) {
        checkPageBreak();

        if (token.type === "heading") {
          const level = (token as { depth: number }).depth;
          const text = (token as { text: string }).text;

          doc.moveDown(level === 1 ? 0.5 : 0.3);

          if (level === 1) {
            doc.rect(60, doc.y, W, 1).fill(COLOURS.harness);
            doc.moveDown(0.3);
            doc.fontSize(18).fillColor(COLOURS.dark).font("Helvetica-Bold").text(text, { width: W });
            doc.rect(60, doc.y + 3, W, 1).fill(COLOURS.border);
            doc.moveDown(0.4);
          } else if (level === 2) {
            doc.fontSize(13).fillColor(COLOURS.harness).font("Helvetica-Bold").text(text, { width: W });
            doc.rect(60, doc.y + 2, 40, 2).fill(COLOURS.harness);
            doc.moveDown(0.3);
          } else if (level === 3) {
            doc.fontSize(11).fillColor(COLOURS.dark).font("Helvetica-Bold").text(text, { width: W });
            doc.moveDown(0.2);
          } else {
            doc.fontSize(10).fillColor(COLOURS.dark).font("Helvetica-Bold").text(text, { width: W });
            doc.moveDown(0.15);
          }

        } else if (token.type === "paragraph") {
          const raw = (token as { text: string }).text;

          // Detect ::: callout blocks embedded in paragraphs (single-line fallback)
          const calloutMatch = raw.match(/^:::\s*(\w+)\s*\n?([\s\S]*?)(?:\n?:::)?$/);
          if (calloutMatch) {
            renderCallout(doc, calloutMatch[1] ?? "info", calloutMatch[2]?.trim() ?? "", W);
            continue;
          }

          // Detect ::: metrics blocks
          if (raw.startsWith(":::")) {
            // skip — handled by html token below
            continue;
          }

          // Strip inline markdown symbols
          const clean = raw
            .replace(/\*\*(.+?)\*\*/g, "$1")
            .replace(/\*(.+?)\*/g, "$1")
            .replace(/`(.+?)`/g, "$1")
            .replace(/\[(.+?)\]\(.+?\)/g, "$1");

          doc.fontSize(10).fillColor(COLOURS.text).font("Helvetica").text(clean, { width: W, lineGap: 2 });
          doc.moveDown(0.3);

        } else if (token.type === "table") {
          const t = token as {
            header: Array<{ text: string }>;
            rows: Array<Array<{ text: string }>>;
          };
          renderTable(doc, t.header.map((h) => h.text), t.rows.map((r) => r.map((c) => c.text)), W);
          doc.moveDown(0.4);

        } else if (token.type === "list") {
          const t = token as { items: Array<{ text: string }> };
          const items = t.items.map((i) => i.text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`(.+?)`/g, "$1"));

          // Check if it's a ::: metrics block
          if (items.some((i) => i.startsWith("label:"))) {
            renderMetricsBlock(doc, items, W);
          } else {
            doc.fontSize(10).fillColor(COLOURS.text).font("Helvetica")
              .list(items, { width: W - 20, bulletRadius: 2, indent: 12, lineGap: 2 });
          }
          doc.moveDown(0.3);

        } else if (token.type === "html") {
          const raw = (token as { text: string }).text;
          // ::: callout and metrics parsed as HTML in some markdown parsers
          const calloutMatch = raw.match(/^:::\s*(\w+)\s*\n([\s\S]*?)(?:\n?:::)/);
          if (calloutMatch) {
            renderCallout(doc, calloutMatch[1] ?? "info", calloutMatch[2]?.trim() ?? "", W);
          }

        } else if (token.type === "hr") {
          doc.moveDown(0.2);
          doc.rect(60, doc.y, W, 1).fill(COLOURS.border);
          doc.moveDown(0.4);

        } else if (token.type === "space") {
          doc.moveDown(0.2);
        }
      }

      addPageFooter();
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function renderCallout(doc: PdfKitDoc, type: string, text: string, W: number): void {
  const colours: Record<string, string> = {
    critical: COLOURS.critical,
    risk: COLOURS.risk,
    warning: COLOURS.warning,
    success: COLOURS.success,
    info: COLOURS.info,
    action: COLOURS.action,
    quote: COLOURS.muted,
  };
  const bgColours: Record<string, string> = {
    critical: "#FEF2F2",
    risk: "#FFFBEB",
    warning: "#FFFBEB",
    success: "#F0FDF4",
    info: "#EFF6FF",
    action: "#F5F3FF",
    quote: "#F9FAFB",
  };
  const accent = colours[type] ?? COLOURS.info;
  const bg = bgColours[type] ?? "#F9FAFB";
  const clean = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`(.+?)`/g, "$1");

  const startY = doc.y;
  const textHeight = Math.max(40, clean.length / 3);

  doc.rect(60, startY, W, textHeight + 24).fill(bg);
  doc.rect(60, startY, 4, textHeight + 24).fill(accent);
  doc.fontSize(9).fillColor(accent).font("Helvetica-Bold")
    .text(type.toUpperCase(), 72, startY + 8, { characterSpacing: 1 });
  doc.fontSize(10).fillColor(COLOURS.text).font("Helvetica")
    .text(clean, 72, doc.y + 2, { width: W - 20, lineGap: 2 });
  doc.y = startY + textHeight + 24 + 4;
  doc.moveDown(0.3);
}

function renderMetricsBlock(doc: PdfKitDoc, items: string[], W: number): void {
  // Parse "label: x\nvalue: y\ntrend: z\ntone: w" from list items
  const metrics: Array<{ label: string; value: string; trend?: string; tone?: string }> = [];
  let cur: Record<string, string> = {};
  for (const item of items) {
    const [k, ...v] = item.split(":");
    if (k && v.length) cur[k.trim()] = v.join(":").trim();
    if (cur.label && cur.value) {
      metrics.push({ label: cur.label, value: cur.value, trend: cur.trend, tone: cur.tone });
      cur = {};
    }
  }
  if (!metrics.length) return;

  const cardW = Math.floor((W - (metrics.length - 1) * 8) / Math.min(metrics.length, 4));
  const cardH = 56;
  let x = 60;
  let rowY = doc.y;
  let col = 0;

  for (const m of metrics) {
    if (col === 4) { x = 60; rowY += cardH + 8; col = 0; }
    const toneColour = COLOURS[m.tone as keyof typeof COLOURS] ?? COLOURS.neutral;
    doc.rect(x, rowY, cardW, cardH).fill("#F9FAFB");
    doc.rect(x, rowY, cardW, 3).fill(toneColour);
    doc.fontSize(8).fillColor(COLOURS.muted).font("Helvetica").text(m.label, x + 8, rowY + 10, { width: cardW - 16 });
    doc.fontSize(16).fillColor(COLOURS.dark).font("Helvetica-Bold").text(m.value, x + 8, rowY + 22, { width: cardW - 16 });
    if (m.trend) {
      doc.fontSize(8).fillColor(toneColour).font("Helvetica").text(m.trend, x + 8, rowY + 42, { width: cardW - 16 });
    }
    x += cardW + 8;
    col++;
  }
  doc.y = rowY + cardH + 12;
}

function renderTable(doc: PdfKitDoc, headers: string[], rows: string[][], W: number): void {
  if (!headers.length) return;
  const colW = Math.floor(W / headers.length);
  const rowH = 22;
  let y = doc.y;

  // Header row
  doc.rect(60, y, W, rowH).fill(COLOURS.dark);
  headers.forEach((h, i) => {
    doc.fontSize(8).fillColor("#FFFFFF").font("Helvetica-Bold")
      .text(h, 60 + i * colW + 6, y + 7, { width: colW - 8 });
  });
  y += rowH;

  // Data rows
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? "#FFFFFF" : COLOURS.bg_light;
    doc.rect(60, y, W, rowH).fill(bg);
    row.forEach((cell, ci) => {
      const clean = cell.replace(/[✅❌🟢🟡🔴🟠⚪]/g, "").trim();
      const colour = cell.includes("✅") || cell.includes("🟢") ? COLOURS.success
        : cell.includes("❌") || cell.includes("🔴") ? COLOURS.critical
        : cell.includes("🟡") || cell.includes("🟠") ? COLOURS.warning
        : COLOURS.text;
      doc.fontSize(8).fillColor(colour).font("Helvetica")
        .text(clean, 60 + ci * colW + 6, y + 7, { width: colW - 8 });
    });
    y += rowH;
    if (y > 827 - 80) {
      doc.addPage();
      y = 60;
    }
  });
  doc.y = y;
}

export function registerMarkdownToPdfTool(server: McpServer): void {
  server.registerTool(
    "harness_iacm_markdown_to_pdf",
    {
      description:
        "Convert a Harness IaCM BVR or report markdown file to a styled PDF. " +
        "Renders YAML frontmatter as a cover page, ::: callout blocks, ::: metrics cards, " +
        "tables, and headings with Harness branding. " +
        "Both input_path and output_path must be absolute paths.",
      inputSchema: z.object({
        input_path: z
          .string()
          .describe("Absolute path to the input markdown file (e.g. /Users/me/reports/bvr/iacm-bvr.md)"),
        output_path: z
          .string()
          .describe("Absolute path for the output PDF file (e.g. /Users/me/reports/bvr/iacm-bvr.pdf)"),
      }),
      annotations: {
        title: "Markdown → PDF (IaCM BVR)",
        readOnlyHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      const inputPath = resolve(args.input_path);
      const outputPath = resolve(args.output_path);

      if (!existsSync(inputPath)) {
        return errorResult(`Input file not found: ${inputPath}`);
      }
      if (extname(inputPath).toLowerCase() !== ".md") {
        return errorResult(`Input file must be a .md file. Got: ${inputPath}`);
      }

      try {
        await renderMarkdownToPdf(inputPath, outputPath);
        const stats = { inputPath, outputPath, pages: "see file" };
        return jsonResult({ success: true, message: `PDF rendered to ${outputPath}`, ...stats });
      } catch (err) {
        return errorResult(`PDF render failed: ${(err as Error).message}`);
      }
    },
  );
}
