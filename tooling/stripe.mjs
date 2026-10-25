import { spawn } from "node:child_process";
import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const envPath = fileURLToPath(new URL("../apps/web/.env", import.meta.url));
const stateDir = fileURLToPath(new URL("../.stripe/", import.meta.url));
const args = process.argv.slice(2);
// Vite+ forwards its task-argument separator to package scripts.
const separator = args.indexOf("--");
if (separator !== -1) args.splice(separator, 1);
const apiKey = process.env.STRIPE_SECRET_KEY;
const informational =
  args.length === 0 ||
  args[0] === "version" ||
  args[0] === "help" ||
  args.some((arg) => ["--help", "-h", "--version", "-v"].includes(arg));

if (args.some((arg) => /^(--live|--api-key)(=|$)/.test(arg))) {
  console.error(
    "This repo's Stripe CLI is sandbox-only. Configure STRIPE_SECRET_KEY in apps/web/.env.",
  );
  process.exit(1);
}

if (!informational && !/^(sk|rk)_test_/.test(apiKey ?? "")) {
  console.error("Set a sandbox STRIPE_SECRET_KEY in apps/web/.env before running Stripe commands.");
  process.exit(1);
}

const listening = args[0] === "listen";
if (listening && !args.some((arg) => /^(--forward-to|-f)(=|$)/.test(arg))) {
  args.push("--forward-to", "http://localhost:5173/api/stripe/webhook");
}

const child = spawn(process.execPath, [require.resolve("@stripe/cli/bin/shim.js"), ...args], {
  env: { ...process.env, STRIPE_API_KEY: apiKey ?? "" },
  // A separate process group lets us stop the CLI shim and its native binary together.
  detached: process.platform !== "win32",
  stdio: ["inherit", "pipe", "pipe"],
});

function stop(signal) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop(signal));

for (const [input, output] of [
  [child.stdout, process.stdout],
  [child.stderr, process.stderr],
]) {
  createInterface({ input }).on("line", (line) => {
    const secret = listening ? line.match(/\bwhsec_[A-Za-z0-9]+\b/)?.[0] : undefined;
    if (secret) {
      try {
        const source = readFileSync(envPath, "utf8");
        const pattern = /^STRIPE_WEBHOOK_SECRET=.*$/gm;
        const matches = source.match(pattern) ?? [];
        if (matches.length > 1) throw new Error("Duplicate STRIPE_WEBHOOK_SECRET entries");
        const entry = `STRIPE_WEBHOOK_SECRET=${secret}`;
        const updated = matches.length
          ? source.replace(pattern, entry)
          : `${source}${source.endsWith("\n") ? "" : "\n"}${entry}\n`;
        mkdirSync(stateDir, { recursive: true, mode: 0o700 });
        const temporaryPath = `${stateDir}/env-${process.pid}.tmp`;
        writeFileSync(temporaryPath, updated, { mode: 0o600 });
        chmodSync(temporaryPath, 0o600);
        renameSync(temporaryPath, envPath);
        output.write("Stripe webhook signing secret saved to apps/web/.env (value hidden).\n");
        output.write("Restart the app if it is already running.\n");
      } catch {
        console.error(
          "Could not save the webhook signing secret to apps/web/.env; stopping Stripe.",
        );
        stop("SIGTERM");
        process.exitCode = 1;
      }
    } else {
      const redacted = line.replace(
        /\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+\b/g,
        "[redacted Stripe API key]",
      );
      output.write(`${redacted}\n`);
    }
  });
}

child.on("error", () => {
  console.error("Could not start the repo-local Stripe CLI. Run vp install first.");
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = process.exitCode || code || (signal === "SIGINT" ? 130 : signal ? 1 : 0);
});
