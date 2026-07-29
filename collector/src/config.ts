import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface DevMeterConfig {
  apiKey: string;
  apiUrl: string;
}

const CONFIG_DIR = join(homedir(), ".devmeter");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");
export const STATUS_PATH = join(CONFIG_DIR, "status.json");

export function readConfig(): DevMeterConfig | null {
  if (!existsSync(CONFIG_PATH)) return null;
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as DevMeterConfig;
}

export function writeConfig(config: DevMeterConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function requireConfig(): DevMeterConfig {
  const config = readConfig();
  if (!config) {
    console.error(
      "No DevMeter API key configured. Run `devmeter login <api_key>` first."
    );
    process.exit(1);
  }
  return config;
}
