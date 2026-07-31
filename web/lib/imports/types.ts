export type ImportedEntry = {
  projectName: string;
  clientName: string | null;
  description: string | null;
  startedAt: Date;
  endedAt: Date;
};

export type ImportTemplate = {
  id: string;
  label: string;
  /** Throws with a human-readable message if the file doesn't look like this template's export format. */
  parse: (buffer: Buffer) => Promise<ImportedEntry[]>;
};
