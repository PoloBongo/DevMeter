import ExcelJS from "exceljs";
import type { ImportTemplate, ImportedEntry } from "./types";

const REQUIRED_HEADERS = [
  "Project",
  "Client",
  "Description",
  "Start Date",
  "Start Time",
  "End Date",
  "End Time",
];

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "text" in value) return String(value.text ?? "");
  return String(value);
}

function parseDatePart(value: ExcelJS.CellValue): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

/** "9:53" or "09:53:00" -> { hours, minutes }. */
function parseTimePart(value: ExcelJS.CellValue): { hours: number; minutes: number } | null {
  const text = cellText(value).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

function combine(datePart: Date, time: { hours: number; minutes: number }): Date {
  return new Date(
    datePart.getFullYear(),
    datePart.getMonth(),
    datePart.getDate(),
    time.hours,
    time.minutes
  );
}

async function parse(buffer: Buffer): Promise<ImportedEntry[]> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    throw new Error(
      "Couldn't read that file as an .xlsx spreadsheet. Export the Clockify \"Detailed report\" as .xlsx (CSV isn't supported)."
    );
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("The file has no worksheet.");

  const headerRow = sheet.getRow(1);
  const columnByHeader = new Map<string, number>();
  headerRow.eachCell((cell, colNumber) => {
    columnByHeader.set(cellText(cell.value).trim(), colNumber);
  });

  const missing = REQUIRED_HEADERS.filter((h) => !columnByHeader.has(h));
  if (missing.length > 0) {
    throw new Error(
      `Doesn't look like a Clockify Detailed report — missing column(s): ${missing.join(", ")}. ` +
        "Export from Clockify's \"Detailed report\" (not \"Summary report\")."
    );
  }

  const col = (name: string) => columnByHeader.get(name)!;
  const entries: ImportedEntry[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const projectName = cellText(row.getCell(col("Project")).value).trim();
    if (!projectName) return;

    const startDate = parseDatePart(row.getCell(col("Start Date")).value);
    const startTime = parseTimePart(row.getCell(col("Start Time")).value);
    const endDate = parseDatePart(row.getCell(col("End Date")).value);
    const endTime = parseTimePart(row.getCell(col("End Time")).value);
    if (!startDate || !startTime || !endDate || !endTime) return;

    const clientName = cellText(row.getCell(col("Client")).value).trim();
    const description = cellText(row.getCell(col("Description")).value).trim();

    entries.push({
      projectName,
      clientName: clientName || null,
      description: description || null,
      startedAt: combine(startDate, startTime),
      endedAt: combine(endDate, endTime),
    });
  });

  return entries;
}

export const clockifyTemplate: ImportTemplate = {
  id: "clockify",
  label: "Clockify (Detailed report)",
  parse,
};
