import { writeConfig } from "../config.ts";

export function loginCommand(apiKey: string, apiUrl: string): void {
  writeConfig({ apiKey, apiUrl });
  console.log(`DevMeter: logged in. API URL set to ${apiUrl}.`);
}
