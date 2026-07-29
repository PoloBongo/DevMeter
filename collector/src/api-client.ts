import type { DevMeterConfig } from "./config.ts";

export interface IngestPayload {
  projectName: string;
  gitBranch?: string;
  ticketRef?: string;
  startedAt: string;
  endedAt: string;
  tokensInput: number;
  tokensOutput: number;
  estimatedCostUsd: number;
}

export async function sendSession(
  config: DevMeterConfig,
  payload: IngestPayload
): Promise<void> {
  const res = await fetch(`${config.apiUrl}/api/sessions/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ingest failed (${res.status}): ${body}`);
  }
}
