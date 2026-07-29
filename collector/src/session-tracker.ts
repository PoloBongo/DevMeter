import type { DevMeterConfig } from "./config.ts";
import { sendSession } from "./api-client.ts";
import { estimateCostUsd } from "./pricing.ts";
import {
  extractTicketRef,
  getCurrentBranch,
  getProjectName,
  guessClientName,
} from "./git.ts";
import { writeFileSync } from "node:fs";
import { STATUS_PATH } from "./config.ts";

interface TokenBucket {
  input: number;
  output: number;
}

export class SessionTracker {
  private readonly cwd: string;
  private readonly config: DevMeterConfig;
  private readonly onActivity?: () => void;
  private startedAt: Date;
  private tokensByModel = new Map<string, TokenBucket>();

  constructor(
    config: DevMeterConfig,
    cwd: string,
    onActivity?: () => void
  ) {
    this.config = config;
    this.cwd = cwd;
    this.startedAt = new Date();
    this.onActivity = onActivity;
  }

  addTokens(model: string, input: number, output: number): void {
    const bucket = this.tokensByModel.get(model) ?? { input: 0, output: 0 };
    bucket.input += input;
    bucket.output += output;
    this.tokensByModel.set(model, bucket);
    this.writeStatus();
    this.onActivity?.();
  }

  private totals() {
    let tokensInput = 0;
    let tokensOutput = 0;
    let estimatedCostUsd = 0;
    for (const [model, bucket] of this.tokensByModel) {
      tokensInput += bucket.input;
      tokensOutput += bucket.output;
      estimatedCostUsd += estimateCostUsd(model, bucket.input, bucket.output);
    }
    return { tokensInput, tokensOutput, estimatedCostUsd };
  }

  private writeStatus(): void {
    const { tokensInput, tokensOutput, estimatedCostUsd } = this.totals();
    writeFileSync(
      STATUS_PATH,
      JSON.stringify(
        {
          cwd: this.cwd,
          gitBranch: getCurrentBranch(this.cwd),
          startedAt: this.startedAt.toISOString(),
          updatedAt: new Date().toISOString(),
          tokensInput,
          tokensOutput,
          estimatedCostUsd,
        },
        null,
        2
      ),
      "utf-8"
    );
  }

  hasActivity(): boolean {
    return this.tokensByModel.size > 0;
  }

  async finalize(): Promise<void> {
    if (!this.hasActivity()) return;

    const { tokensInput, tokensOutput, estimatedCostUsd } = this.totals();
    const gitBranch = getCurrentBranch(this.cwd);

    await sendSession(this.config, {
      projectName: getProjectName(this.cwd),
      clientName: guessClientName(this.cwd) ?? undefined,
      gitBranch: gitBranch ?? undefined,
      ticketRef: extractTicketRef(gitBranch) ?? undefined,
      startedAt: this.startedAt.toISOString(),
      endedAt: new Date().toISOString(),
      tokensInput,
      tokensOutput,
      estimatedCostUsd,
    });

    this.tokensByModel.clear();
    this.startedAt = new Date();
  }
}
