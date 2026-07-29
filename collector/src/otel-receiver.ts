import { createServer, type Server } from "node:http";
import type { SessionTracker } from "./session-tracker.ts";

const TOKEN_METRIC_NAME = "claude_code.token.usage";
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

interface ResourceMetrics {
  scopeMetrics?: ScopeMetrics[];
}

interface OtlpMetricsPayload {
  resourceMetrics?: ResourceMetrics[];
}

function attributeValue(dataPoint: DataPoint, key: string): string | null {
  const attr = dataPoint.attributes?.find((a) => a.key === key);
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
    const model = attributeValue(dataPoint, "model") ?? "unknown";
    const type = attributeValue(dataPoint, "type");
    const value = dataPointValue(dataPoint);
    if (value <= 0) continue;

    if (type === "output") {
      tracker.addTokens(model, 0, value);
    } else {
      tracker.addTokens(model, value, 0);
    }
  }
}

export function startOtelReceiver(
  tracker: SessionTracker,
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
