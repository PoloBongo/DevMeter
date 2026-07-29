import { spawn } from "node:child_process";

/**
 * Launches `claude` with telemetry wired to the local DevMeter collector and
 * tagged with the current directory via the standard OTEL_RESOURCE_ATTRIBUTES
 * env var. This lets the collector attribute tokens to the right project even
 * if it was started from a different directory, or if you switch projects
 * across multiple `claude` sessions without restarting `devmeter start`.
 */
export function claudeCommand(args: string[]): void {
  const cwd = process.cwd();

  const env = {
    ...process.env,
    CLAUDE_CODE_ENABLE_TELEMETRY: "1",
    OTEL_METRICS_EXPORTER: "otlp",
    OTEL_EXPORTER_OTLP_PROTOCOL: "http/json",
    OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318",
    OTEL_METRIC_EXPORT_INTERVAL: "10000",
    OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: "delta",
    OTEL_RESOURCE_ATTRIBUTES: `devmeter.cwd=${cwd}`,
  };

  const child = spawn("claude", args, {
    cwd,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("error", (error) => {
    console.error(`Failed to launch \`claude\`: ${error.message}`);
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}
