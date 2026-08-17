import PDFDocument from "pdfkit";
import * as xlsx from "xlsx";
import { ReportResponse } from "../domain/report.types.js";

// ═══════════════════════════════════════════════════════════════════════════════
// SENSITIVE DATA SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

// Keys that must NEVER appear in any exported file. Matched case-insensitively.
// Covers: credentials, tokens, hashes, internal IDs that leak tenancy, secrets.
const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /^password/i,
  /hash$/i,
  /^secret/i,
  /token/i,
  /^authorization$/i,
  /^cookie$/i,
  /^apikey$/i,
  /^api[_-]?key$/i,
  /^session/i,
  /^creditcard/i,
  /^card[_-]?number/i,
  /^cvv$/i,
  /^ssn$/i,
  /^salt$/i,
  /^private[_-]?key/i,
  /^otp$/i,
];

// Internal system fields that are not useful in business exports.
const INTERNAL_FIELDS = new Set([
  "companyid",
  "company_id",
  "tenantid",
  "tenant_id",
]);

/** Returns true if a key is sensitive or internal and should be stripped. */
const isSensitiveKey = (key: string): boolean => {
  const lower = key.toLowerCase();
  if (INTERNAL_FIELDS.has(lower)) return true;
  return SENSITIVE_KEY_PATTERNS.some((re) => re.test(lower));
};

/**
 * Deep-sanitize a value: recursively strip sensitive keys from objects/arrays.
 * Primitive values pass through unchanged.
 */
const sanitize = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === "object" && value instanceof Date) return value;
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(k)) continue; // silently drop
      result[k] = sanitize(v);
    }
    return result;
  }
  return value;
};

/** Sanitize an entire ReportResponse before any export format processes it. */
const sanitizeReport = (report: ReportResponse): ReportResponse => {
  // Strip companyId and internal filters from meta — they are tenant-specific.
  const safeMeta = report.meta
    ? {
      reportKey: report.meta.reportKey,
      companyId: "[REDACTED]",
      from: report.meta.from,
      to: report.meta.to,
      timezone: report.meta.timezone,
      generatedAt: report.meta.generatedAt,
      // Expose only business-relevant filters (resolution, limit, etc.)
      filters: sanitize(report.meta.filters) as Record<string, unknown>,
    }
    : report.meta;

  return {
    meta: safeMeta,
    summary: sanitize(report.summary) as any,
    rows: (report.rows ?? []).map((r) => sanitize(r)) as any[],
    charts: report.charts ? (report.charts.map((c) => sanitize(c)) as any[]) : undefined,
    comparison: report.comparison ? (sanitize(report.comparison) as any) : undefined,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// Leading characters a spreadsheet will treat as the start of a formula.
const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

// Render a single value as a safe CSV field:
//  1. Formula-injection guard — a non-numeric cell beginning with =, +, -, @,
//     tab or CR is prefixed with a single quote so Excel/Sheets treat it as
//     literal text. Numbers are exempt so real negatives aren't mangled.
//  2. RFC-4180 quoting — fields containing a quote, comma, or newline are
//     wrapped in double quotes with internal quotes doubled.
const escapeCsvField = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  let str = typeof value === "object" ? JSON.stringify(value) : String(value);

  if (typeof value !== "number" && FORMULA_PREFIXES.includes(str.charAt(0))) {
    str = `'${str}`;
  }

  if (/["\n\r,]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

// Flatten a value to a single short cell string for the PDF table.
const cellText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/** Convert a camelCase or snake_case key to a readable column header. */
const humanizeKey = (key: string): string =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Flatten an array of objects into a CSV section (header + rows). */
const objectsToCsvSection = (data: any[]): string => {
  if (!data || data.length === 0) return "";
  const keys = Object.keys(data[0]);
  const headers = keys.map((k) => escapeCsvField(humanizeKey(k))).join(",");
  const rows = data
    .map((row) =>
      keys
        .map((k) => escapeCsvField((row as Record<string, unknown>)[k]))
        .join(","),
    )
    .join("\n");
  return `${headers}\n${rows}`;
};

/** Flatten a summary object into key-value CSV lines. */
const summaryToCsvSection = (summary: any): string => {
  if (!summary || typeof summary !== "object" || Array.isArray(summary))
    return "";
  return Object.entries(summary as Record<string, unknown>)
    .filter(([_, v]) => v === null || typeof v !== "object")
    .map(
      ([k, v]) => `${escapeCsvField(humanizeKey(k))},${escapeCsvField(v)}`,
    )
    .join("\n");
};

/**
 * Flatten nested comparison data into flat arrays for export.
 * comparison can be { byStaff: [...], byCategory: [...], ... }
 */
const flattenComparison = (
  comparison: any,
): Array<{ label: string; data: any[] }> => {
  if (!comparison || typeof comparison !== "object") return [];
  if (Array.isArray(comparison))
    return [{ label: "Comparison", data: comparison }];
  return Object.entries(comparison)
    .filter(([_, v]) => Array.isArray(v) && (v as any[]).length > 0)
    .map(([k, v]) => ({ label: humanizeKey(k), data: v as any[] }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export const reportExportService = {
  // ─── CSV ─────────────────────────────────────────────────────────────────────
  toCsv: (rawReport: ReportResponse): string => {
    const report = sanitizeReport(rawReport);
    const meta = report.meta;
    const sections: string[] = [];

    // Report header
    const title = humanizeKey(meta?.reportKey ?? "Report");
    sections.push(`"${title} Report"`);
    if (meta) {
      sections.push(
        `"Period","${meta.from} to ${meta.to}"`,
      );
      sections.push(`"Generated At","${meta.generatedAt}"`);
      sections.push(`"Timezone","${meta.timezone}"`);
    }
    sections.push(""); // blank line separator

    // Summary
    const summarySection = summaryToCsvSection(report.summary);
    if (summarySection) {
      sections.push('"SUMMARY"');
      sections.push("Metric,Value");
      sections.push(summarySection);
      sections.push("");
    }

    // Details / Rows
    if (report.rows && report.rows.length > 0) {
      sections.push('"DETAILS"');
      sections.push(objectsToCsvSection(report.rows));
      sections.push("");
    }

    // Charts / Trends
    if (report.charts && report.charts.length > 0) {
      sections.push('"TRENDS"');
      sections.push(objectsToCsvSection(report.charts));
      sections.push("");
    }

    // Comparison breakdowns
    const compSections = flattenComparison(report.comparison);
    for (const { label, data } of compSections) {
      sections.push(`"${label.toUpperCase()}"`);
      sections.push(objectsToCsvSection(data));
      sections.push("");
    }

    return sections.join("\n");
  },

  // ─── PDF ─────────────────────────────────────────────────────────────────────
  // Professional A4 document with styled header, summary block, detail table,
  // charts section, and comparison breakdowns. Auto-paginates with headers.
  toPdf: (rawReport: ReportResponse): Promise<Buffer> =>
    new Promise((resolve, reject) => {
      const report = sanitizeReport(rawReport);
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const left = doc.page.margins.left;
      const right = doc.page.margins.right;
      const usableWidth = doc.page.width - left - right;
      const meta = report.meta;

      // ── Shared helpers ───────────────────────────────────────────────────
      const addPageFooter = () => {
        const y = doc.page.height - 30;
        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor("#999")
          .text("CONFIDENTIAL — For internal use only", left, y, {
            width: usableWidth,
            align: "center",
          });
      };

      const ensureSpace = (needed: number) => {
        const bottomLimit =
          doc.page.height - doc.page.margins.bottom - 40; // 40 for footer
        if (doc.y + needed > bottomLimit) {
          addPageFooter();
          doc.addPage();
        }
      };

      /** Draw a bordered, paginated table from an array of objects. */
      const drawTable = (data: any[]) => {
        if (!data || data.length === 0) return;

        const keys = Object.keys(data[0] as Record<string, unknown>);
        const colWidth = usableWidth / keys.length;
        const rowHeight = 18;
        const bottomLimit =
          doc.page.height - doc.page.margins.bottom - 40;

        const drawHeaderRow = () => {
          const y = doc.y;
          // Header background
          doc
            .rect(left, y, usableWidth, rowHeight)
            .fill("#2c3e50");
          doc.font("Helvetica-Bold").fontSize(7).fillColor("#ffffff");
          keys.forEach((k, i) => {
            doc.text(humanizeKey(k), left + i * colWidth + 3, y + 4, {
              width: colWidth - 6,
              height: rowHeight - 4,
              ellipsis: true,
              lineBreak: false,
            });
          });
          doc.fillColor("#000000");
          doc.y = y + rowHeight;
        };

        drawHeaderRow();

        doc.font("Helvetica").fontSize(7);
        let odd = false;
        for (const row of data as Array<Record<string, unknown>>) {
          if (doc.y > bottomLimit) {
            addPageFooter();
            doc.addPage();
            drawHeaderRow();
            doc.font("Helvetica").fontSize(7);
          }

          const y = doc.y;
          // Alternate row shading
          if (odd) {
            doc
              .rect(left, y, usableWidth, rowHeight)
              .fill("#f8f9fa");
            doc.fillColor("#000000");
          }
          odd = !odd;

          keys.forEach((k, i) => {
            doc.text(cellText(row[k]), left + i * colWidth + 3, y + 4, {
              width: colWidth - 6,
              height: rowHeight - 4,
              ellipsis: true,
              lineBreak: false,
            });
          });
          doc.y = y + rowHeight;
        }
      };

      const drawSectionTitle = (title: string) => {
        ensureSpace(30);
        doc.moveDown(0.5);
        doc.font("Helvetica-Bold").fontSize(11).fillColor("#2c3e50").text(title);
        doc
          .moveTo(left, doc.y + 2)
          .lineTo(left + usableWidth, doc.y + 2)
          .lineWidth(0.5)
          .strokeColor("#bdc3c7")
          .stroke();
        doc.moveDown(0.4);
        doc.fillColor("#000000");
      };

      // ── Report Title Header ──────────────────────────────────────────────
      const title = humanizeKey(meta?.reportKey ?? "Report");

      // Title bar background
      doc
        .rect(left, doc.y, usableWidth, 36)
        .fill("#2c3e50");
      const titleY = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("#ffffff")
        .text(`${title} Report`, left + 12, titleY + 10, { width: usableWidth - 24 });
      doc.y = titleY + 42;
      doc.fillColor("#000000");

      // Meta info
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(9).fillColor("#555555");
      if (meta) {
        doc.text(`Period: ${meta.from}  →  ${meta.to}`);
        doc.text(`Generated: ${meta.generatedAt}  |  Timezone: ${meta.timezone}`);
      }
      doc.fillColor("#000000").moveDown(0.6);

      // ── Summary Section ──────────────────────────────────────────────────
      const summary = report.summary;
      if (summary && typeof summary === "object" && !Array.isArray(summary)) {
        const entries = Object.entries(
          summary as Record<string, unknown>,
        ).filter(([_, v]) => v === null || typeof v !== "object");

        if (entries.length > 0) {
          drawSectionTitle("Summary");

          // Render summary as a 2-column key-value table
          doc.font("Helvetica").fontSize(9);
          const kvRowHeight = 16;
          for (const [k, v] of entries) {
            ensureSpace(kvRowHeight);
            const y = doc.y;
            doc
              .font("Helvetica-Bold")
              .fontSize(8)
              .text(humanizeKey(k), left + 4, y + 3, {
                width: usableWidth * 0.45,
                lineBreak: false,
              });
            doc
              .font("Helvetica")
              .fontSize(8)
              .text(cellText(v), left + usableWidth * 0.5, y + 3, {
                width: usableWidth * 0.5,
                lineBreak: false,
              });
            doc.y = y + kvRowHeight;
          }

          // Nested summary objects (e.g. todayOrders, fulfillment)
          const nestedEntries = Object.entries(
            summary as Record<string, unknown>,
          ).filter(
            ([_, v]) => v !== null && typeof v === "object" && !Array.isArray(v),
          );
          for (const [k, v] of nestedEntries) {
            doc.moveDown(0.3);
            doc.font("Helvetica-Bold").fontSize(8).fillColor("#7f8c8d").text(`  ${humanizeKey(k)}:`);
            doc.fillColor("#000000");
            const subEntries = Object.entries(v as Record<string, unknown>).filter(
              ([_, sv]) => sv === null || typeof sv !== "object",
            );
            for (const [sk, sv] of subEntries) {
              ensureSpace(kvRowHeight);
              const y = doc.y;
              doc
                .font("Helvetica")
                .fontSize(8)
                .text(`    ${humanizeKey(sk)}`, left + 4, y + 3, {
                  width: usableWidth * 0.45,
                  lineBreak: false,
                });
              doc
                .font("Helvetica")
                .fontSize(8)
                .text(cellText(sv), left + usableWidth * 0.5, y + 3, {
                  width: usableWidth * 0.5,
                  lineBreak: false,
                });
              doc.y = y + kvRowHeight;
            }
          }
        }
      }

      // ── Detail Rows ──────────────────────────────────────────────────────
      const rows = report.rows ?? [];
      if (rows.length > 0) {
        drawSectionTitle("Details");
        drawTable(rows);
      }

      // ── Charts / Trends ──────────────────────────────────────────────────
      if (report.charts && report.charts.length > 0) {
        drawSectionTitle("Trends");
        drawTable(report.charts);
      }

      // ── Comparison Breakdowns ────────────────────────────────────────────
      const compSections = flattenComparison(report.comparison);
      for (const { label, data } of compSections) {
        drawSectionTitle(label);
        drawTable(data);
      }

      // ── No data fallback ─────────────────────────────────────────────────
      if (
        rows.length === 0 &&
        (!report.charts || report.charts.length === 0) &&
        compSections.length === 0
      ) {
        doc
          .font("Helvetica-Oblique")
          .fontSize(9)
          .fillColor("#777777")
          .text("No data available for the selected period.");
      }

      // Footer
      addPageFooter();
      doc.end();
    }),

  // ─── EXCEL ───────────────────────────────────────────────────────────────────
  // Multi-sheet workbook: Summary, Details, Trends, and each comparison
  // breakdown on its own sheet. Auto-sizes columns and adds header styling.
  toExcel: (rawReport: ReportResponse): Buffer => {
    const report = sanitizeReport(rawReport);
    const wb = xlsx.utils.book_new();
    const summary = report.summary;

    // Helper: create sheet from array of objects with humanized headers
    const addSheet = (name: string, data: any[]) => {
      if (!data || data.length === 0) return;
      // Humanize keys for column headers
      const keys = Object.keys(data[0]);
      const humanized = data.map((row) => {
        const out: Record<string, unknown> = {};
        for (const k of keys) {
          out[humanizeKey(k)] = (row as Record<string, unknown>)[k];
        }
        return out;
      });
      const ws = xlsx.utils.json_to_sheet(humanized);

      // Auto-size columns (approximate based on content)
      const headerKeys = humanized[0] ? Object.keys(humanized[0]) : [];
      const colWidths = headerKeys.map((header) => {
        const keyIdx = headerKeys.indexOf(header);
        const originalKey = keyIdx >= 0 ? keys[keyIdx] : header;
        const maxData = data.reduce((max, row) => {
          const val = cellText((row as Record<string, unknown>)[originalKey!]);
          return Math.max(max, val.length);
        }, header.length);
        return { wch: Math.min(Math.max(maxData + 2, 10), 40) };
      });
      ws["!cols"] = colWidths;

      xlsx.utils.book_append_sheet(wb, ws, name.slice(0, 31)); // Excel 31 char limit
    };

    // ── Meta Sheet ─────────────────────────────────────────────────────────
    const meta = report.meta;
    if (meta) {
      const metaRows = [
        { Field: "Report", Value: humanizeKey(meta.reportKey) },
        { Field: "Period From", Value: meta.from },
        { Field: "Period To", Value: meta.to },
        { Field: "Timezone", Value: meta.timezone },
        { Field: "Generated At", Value: meta.generatedAt },
      ];
      const wsMeta = xlsx.utils.json_to_sheet(metaRows);
      wsMeta["!cols"] = [{ wch: 16 }, { wch: 32 }];
      xlsx.utils.book_append_sheet(wb, wsMeta, "Report Info");
    }

    // ── Summary Sheet ──────────────────────────────────────────────────────
    if (summary && typeof summary === "object" && !Array.isArray(summary)) {
      const flatEntries = Object.entries(
        summary as Record<string, unknown>,
      ).filter(([_, v]) => v === null || typeof v !== "object");

      // Also flatten nested summary objects (e.g. todayOrders, fulfillment)
      const nestedEntries = Object.entries(
        summary as Record<string, unknown>,
      ).filter(
        ([_, v]) => v !== null && typeof v === "object" && !Array.isArray(v),
      );

      const summaryRows: { Metric: string; Value: string }[] = [];
      for (const [k, v] of flatEntries) {
        summaryRows.push({ Metric: humanizeKey(k), Value: cellText(v) });
      }
      for (const [k, v] of nestedEntries) {
        summaryRows.push({ Metric: `── ${humanizeKey(k)} ──`, Value: "" });
        for (const [sk, sv] of Object.entries(v as Record<string, unknown>)) {
          if (sv !== null && typeof sv === "object") continue;
          summaryRows.push({
            Metric: `  ${humanizeKey(sk)}`,
            Value: cellText(sv),
          });
        }
      }

      if (summaryRows.length > 0) {
        const wsSummary = xlsx.utils.json_to_sheet(summaryRows);
        wsSummary["!cols"] = [{ wch: 28 }, { wch: 20 }];
        xlsx.utils.book_append_sheet(wb, wsSummary, "Summary");
      }
    }

    // ── Details Sheet ──────────────────────────────────────────────────────
    if (report.rows && report.rows.length > 0) {
      addSheet("Details", report.rows);
    }

    // ── Trends Sheet ───────────────────────────────────────────────────────
    if (report.charts && report.charts.length > 0) {
      addSheet("Trends", report.charts);
    }

    // ── Comparison Sheets ──────────────────────────────────────────────────
    const compSections = flattenComparison(report.comparison);
    for (const { label, data } of compSections) {
      addSheet(label, data);
    }

    // Fallback if nothing was added
    if (wb.SheetNames.length === 0) {
      const wsEmpty = xlsx.utils.json_to_sheet([
        { Message: "No data available for the selected period." },
      ]);
      xlsx.utils.book_append_sheet(wb, wsEmpty, "Report");
    }

    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  },
};
