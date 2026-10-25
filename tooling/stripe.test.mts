import test from "node:test";

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("stripe.mts", import.meta.url));
const sandboxKey = "sk_test_fake_guard_test_key";

for (const { name, args, key = sandboxKey } of [
  { name: "missing sandbox key", args: ["listen", "--print-secret"], key: "" },
  {
    name: "live API key",
    args: ["listen", "--print-secret"],
    key: "sk_live_fake_guard_test_key",
  },
  { name: "live-mode flag", args: ["listen", "--live"] },
  { name: "inline live-mode flag", args: ["listen", "--live=true"] },
  { name: "API-key override", args: ["listen", "--api-key", "sk_live_fake_override"] },
  { name: "inline API-key override", args: ["listen", "--api-key=sk_live_fake_override"] },
  { name: "leading Vite+ separator", args: ["--", "listen", "--live"] },
  { name: "webhook task separator", args: ["listen", "--all-snapshot", "--", "--live"] },
]) {
  void test(`rejects ${name} before contacting Stripe`, () => {
    const result = spawnSync(process.execPath, [script, ...args], {
      env: { ...process.env, STRIPE_SECRET_KEY: key, STRIPE_API_KEY: "" },
      encoding: "utf8",
      timeout: 3000,
    });

    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /sandbox/);
    assert.equal(result.stdout, "");
    assert.doesNotMatch(result.stderr, /(?:sk|rk)_(?:test|live)_/);
  });
}
