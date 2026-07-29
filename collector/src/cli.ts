#!/usr/bin/env node
import { Command } from "commander";
import { loginCommand } from "./commands/login.ts";
import { startCommand } from "./commands/start.ts";
import { statusCommand } from "./commands/status.ts";

const program = new Command();

program
  .name("devmeter")
  .description("DevMeter local collector — tracks time and AI cost per session")
  .version("0.1.0");

program
  .command("login")
  .argument("<api_key>", "personal API key from DevMeter → Settings")
  .option(
    "--api-url <url>",
    "DevMeter API base URL",
    process.env.DEVMETER_API_URL ?? "http://localhost:3000"
  )
  .action((apiKey: string, options: { apiUrl: string }) => {
    loginCommand(apiKey, options.apiUrl);
  });

program
  .command("start")
  .description("Start listening for Claude Code telemetry in this directory")
  .action(() => {
    void startCommand();
  });

program
  .command("status")
  .description("Show the current in-progress session, if any")
  .action(() => {
    statusCommand();
  });

program.parse();
