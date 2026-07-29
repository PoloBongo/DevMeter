import { createServer, type Server } from "node:http";
import type { SessionTracker } from "./session-tracker.ts";

const TOKEN_METRIC_NAME = "claude_code.token.usage";
const CWD_RESOURCE_ATTRIBUTE = "devmeter.cwd";
const DEFAULT_PORT = 4318;

interface AttributeValue {
  stringValue?: string;
}

interface Attribute {
  key: string;
  value?: AttributeValue;
}

interface DataPoint {
  attributes?: Attribute[];
  asInt?: string | number;
  asDouble?: number;
}

interface Metric {
  name: string;
  sum?: { dataPoints?: DataPoint[] };
  gauge?: { dataPoints?: DataPoint[] };
}

interface ScopeMetrics {
  metrics?: Metric[];
}

interface Resource {
  attributes?: Attribute[];
}

interface ResourceMetrics {
  resource?: Resource;
  scopeMetrics?: ScopeMetrics[];
}

interface OtlpMetricsPayload {
  resourceMetrics?: ResourceMetrics[];
}

function findAttribute(attributes: Attribute[] | undefined, key: string): string | null {
  const attr = attributes?.find((a) => a.key === key);
  return attr?.value?.stringValue ?? null;
}

function dataPointValue(dataPoint: DataPoint): number {
  if (typeof dataPoint.asDouble === "number") return dataPoint.asDouble;
  if (dataPoint.asInt !== undefined) return Number(dataPoint.asInt);
  return 0;
}

function isOtlpMetricsPayload(value: unknown): value is OtlpMetricsPayload {
  return typeof value === "object" && value !== null;
}

function handleTokenMetric(metric: Metric, tracker: SessionTracker): void {
  const dataPoints = metric.sum?.dataPoints ?? metric.gauge?.dataPoints ?? [];
  for (const dataPoint of dataPoints) {
    const model = findAttribute(dataPoint.attributes, "model") ?? "unknown";
    const type = findAttribute(dataPoint.attributes, "type");
    const value = dataPointValue(dataPoint);
    if (value <= 0) continue;

    if (type === "output") {
      tracker.addTokens(model, 0, value);
    } else {
      tracker.addTokens(model, value, 0);
    }
  }
}

/**
 * `getTracker` resolves which project a batch of metrics belongs to. When a
 * session was launched via `devmeter claude`, the payload's resource carries
 * a `devmeter.cwd` attribute (set via OTEL_RESOURCE_ATTRIBUTES) identifying
 * exactly where that `claude` process was running — independent of where
 * `devmeter start` itself was launched. Sessions started by hand (manually
 * exporting the OTEL_* vars) carry no such attribute and fall back to the
 * collector's own cwd, matching the old single-project behavior.
 */
export function startOtelReceiver(
  getTracker: (cwd: string) => SessionTracker,
  fallbackCwd: string,
  port = DEFAULT_PORT
): Server {
  const server = createServer((req, res) => {
    if (req.method !== "POST" || !req.url?.startsWith("/v1/metrics")) {
      res.writeHead(404).end();
      return;
    }

    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
        if (isOtlpMetricsPayload(body)) {
          for (const resourceMetrics of body.resourceMetrics ?? []) {
            const cwd =
              findAttribute(resourceMetrics.resource?.attributes, CWD_RESOURCE_ATTRIBUTE) ??
              fallbackCwd;
            const tracker = getTracker(cwd);
            for (const scopeMetrics of resourceMetrics.scopeMetrics ?? []) {
              for (const metric of scopeMetrics.metrics ?? []) {
                if (metric.name === TOKEN_METRIC_NAME) {
                  handleTokenMetric(metric, tracker);
                }
              }
            }
          }
        }
      } catch {
        // Ignore malformed payloads rather than crashing the collector.
      }
      res.writeHead(200, { "Content-Type": "application/json" }).end("{}");
    });
  });

  server.listen(port);
  return server;
}
