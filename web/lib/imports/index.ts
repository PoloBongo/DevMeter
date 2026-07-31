import { clockifyTemplate } from "./clockify";
import type { ImportTemplate } from "./types";

export type { ImportedEntry, ImportTemplate } from "./types";

export const IMPORT_TEMPLATES: ImportTemplate[] = [clockifyTemplate];

export function findImportTemplate(id: string): ImportTemplate | null {
  return IMPORT_TEMPLATES.find((t) => t.id === id) ?? null;
}
