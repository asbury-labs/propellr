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
// Only the checked-in frozen protocol, at its pinned digest (tools/frozen-protocol.json), may bind
// an evaluation. Update the pin together with any intentional protocol revision.
const frozen = JSON.parse(readFileSync("tools/frozen-protocol.json", "utf8")) as {
  readonly path: string;
  readonly sha256: string;
};
const FROZEN_PROTOCOL = frozen.path;
const FROZEN_PROTOCOL_SHA256 = frozen.sha256;
if (protocol !== FROZEN_PROTOCOL) refuse(`only ${FROZEN_PROTOCOL} may bind an evaluation`);
if (!existsSync(protocol)) refuse(`protocol ${protocol} not found`);
if (createHash("sha256").update(readFileSync(protocol)).digest("hex") !== FROZEN_PROTOCOL_SHA256)
  refuse("protocol digest does not match the pinned frozen protocol");
// Each provider arm needs its own approval record and key.
const arms: Readonly<Record<string, { readonly approval: string; readonly key: string }>> = {
  jev: { approval: "PROPELLR_DECISION_APPROVAL", key: "TYPESAFE_API_KEY" },
  llm: { approval: "PROPELLR_LLM_APPROVAL", key: "ANTHROPIC_API_KEY" },
};
const arm = arms[provider];
if (arm) {
  const approval = process.env[arm.approval];
  const label = provider === "jev" ? "provider" : "LLM";
  if (!approval || !existsSync(approval))
    refuse(`${label} approval record missing (${arm.approval})`);
  if (!process.env[arm.key])
    refuse(`${label === "LLM" ? "LLM" : "provider"} key missing (${arm.key})`);
  try {
    JSON.parse(readFileSync(approval!, "utf8"));
  } catch {
    refuse("approval record invalid (unreadable JSON)");
  }
}
// Holdout opens once, after both adjudicators' labels exist, with every arm run together.
if (split === "holdout")
  refuse("holdout is sealed until both adjudicators' labels exist and all three arms run together");
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
