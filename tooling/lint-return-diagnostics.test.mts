import test from "node:test";

import assert from "node:assert/strict";

import { readLintReturnTypeDiagnostics } from "./lint-return-diagnostics.mts";

const fixtureDiagnostic = {
  code: "typescript(explicit-function-return-type)",
  severity: "error",
  filename: "example.ts",
  labels: [{ span: { offset: 12, length: 3 } }],
};

await test("reads diagnostics when lint exits with findings", (): void => {
  const payload = JSON.stringify({ diagnostics: [fixtureDiagnostic] });
  const source = `process.stdout.write(${JSON.stringify(payload)}); process.exitCode = 1;`;
  const diagnostics = readLintReturnTypeDiagnostics(
    process.execPath,
    ["--eval", source],
    process.cwd(),
  );

  assert.deepEqual(diagnostics, [fixtureDiagnostic]);
});

await test("rejects failed lint commands before using their output", (): void => {
  const payload = JSON.stringify({ diagnostics: [] });
  const source = `process.stdout.write(${JSON.stringify(payload)}); process.exitCode = 2;`;
  assert.throws(
    () => readLintReturnTypeDiagnostics(process.execPath, ["--eval", source], process.cwd()),
    /Return type lint process failed: 2/,
  );
});

await test("rejects malformed lint byte offsets at the JSON boundary", (): void => {
  const payload = JSON.stringify({
    diagnostics: [{ ...fixtureDiagnostic, labels: [{ span: { offset: "12", length: 3 } }] }],
  });
  const source = `process.stdout.write(${JSON.stringify(payload)}); process.exitCode = 1;`;

  assert.throws(
    () => readLintReturnTypeDiagnostics(process.execPath, ["--eval", source], process.cwd()),
    /expected number/,
  );
});
