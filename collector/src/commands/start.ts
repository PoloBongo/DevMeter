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

  console.log("DevMeter collector listening on http://localhost:4318");
  console.log(`Tracking project in: ${cwd}\n`);
  console.log("Export these in this terminal before running `claude`:\n");
  console.log("  export CLAUDE_CODE_ENABLE_TELEMETRY=1");
  console.log("  export OTEL_METRICS_EXPORTER=otlp");
  console.log("  export OTEL_EXPORTER_OTLP_PROTOCOL=http/json");
  console.log("  export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318");
  console.log("  export OTEL_METRIC_EXPORT_INTERVAL=10000");
  console.log(
    "  export OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE=delta\n"
  );
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
