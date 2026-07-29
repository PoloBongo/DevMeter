import { requireConfig } from "../config.ts";
import { SessionTracker } from "../session-tracker.ts";
import { startOtelReceiver } from "../otel-receiver.ts";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export async function startCommand(): Promise<void> {
  const config = requireConfig();
  const cwd = process.cwd();

  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleIdleFlush = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      void tracker.finalize().then(() => {
        console.log("\nIdle for 15 minutes — session sent to DevMeter.");
      });
    }, IDLE_TIMEOUT_MS);
  };

  const tracker = new SessionTracker(config, cwd, scheduleIdleFlush);
  const server = startOtelReceiver(tracker);
  scheduleIdleFlush();

  const otelVars: Record<string, string> = {
    CLAUDE_CODE_ENABLE_TELEMETRY: "1",
    OTEL_METRICS_EXPORTER: "otlp",
    OTEL_EXPORTER_OTLP_PROTOCOL: "http/json",
    OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318",
    OTEL_METRIC_EXPORT_INTERVAL: "10000",
    OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: "delta",
  };

  console.log("DevMeter collector listening on http://localhost:4318");
  console.log(`Tracking project in: ${cwd}\n`);
  console.log(
    "Set these in a separate terminal before running `claude` there:\n"
  );
  if (process.platform === "win32") {
    for (const [key, value] of Object.entries(otelVars)) {
      console.log(`  $env:${key} = "${value}"`);
    }
  } else {
    for (const [key, value] of Object.entries(otelVars)) {
      console.log(`  export ${key}=${value}`);
    }
  }
  console.log("");
  console.log("Press Ctrl+C to stop and send this session to DevMeter.\n");

  const shutdown = async () => {
    console.log("\nStopping collector, sending session…");
    if (idleTimer) clearTimeout(idleTimer);
    server.close();
    try {
      await tracker.finalize();
      console.log("Done.");
    } catch (error) {
      console.error("Failed to send session:", error);
    }
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}
