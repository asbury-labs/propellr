// pnpm eval:components -- --provider heuristic|jev|llm --split dev|holdout --protocol <file>
// Refuses provider arms without an approval record and key, and keeps the holdout sealed.
// No cached, mocked or loopback result can stand in for a live provider run.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";

// pnpm forwards the leading "--" separator; strip it so options still parse.
const argv = process.argv.slice(2);
const { values } = parseArgs({
  args: argv[0] === "--" ? argv.slice(1) : argv,
  options: {
    provider: { type: "string", default: "heuristic" },
    split: { type: "string", default: "dev" },
    protocol: { type: "string", default: "specs/component-inference-protocol.md" },
  },
});
const refuse = (message: string): never => {
  process.stderr.write(`blocked: ${message}\n`);
  process.exit(2);
};
const { provider, split, protocol } = values;
if (!["heuristic", "jev", "llm"].includes(provider)) refuse(`unknown provider ${provider}`);
if (!["dev", "holdout"].includes(split)) refuse(`unknown split ${split}`);
if (!existsSync(protocol)) refuse(`protocol ${protocol} not found`);
if (provider === "llm") refuse("no structured-output LLM client or approval exists for phase 2");
if (provider === "jev") {
  const approval = process.env["PROPELLR_DECISION_APPROVAL"];
  if (!approval || !existsSync(approval))
    refuse("provider approval record missing (PROPELLR_DECISION_APPROVAL)");
  if (!process.env["TYPESAFE_API_KEY"]) refuse("provider key missing (TYPESAFE_API_KEY)");
  try {
    JSON.parse(readFileSync(approval!, "utf8"));
  } catch {
    refuse("approval record invalid (unreadable JSON)");
  }
}
// Holdout opens only when every approved arm can run on it together.
if (split === "holdout")
  refuse("holdout is sealed until heuristic, LLM and Jev arms are all approved");
const run = spawnSync(
  process.execPath,
  ["node_modules/vitest/vitest.mjs", "run", "--project", "evaluation"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH:
        process.env["PLAYWRIGHT_BROWSERS_PATH"] ?? `${process.cwd()}/.tools/browsers`,
      PROPELLR_EVAL_PROVIDER: provider,
      PROPELLR_EVAL_SPLIT: split,
      PROPELLR_EVAL_PROTOCOL: protocol,
      PROPELLR_EVAL_PROTOCOL_SHA256: createHash("sha256")
        .update(readFileSync(protocol))
        .digest("hex"),
    },
  },
);
process.exit(run.status ?? 1);
