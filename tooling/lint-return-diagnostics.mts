import { spawnSync } from "node:child_process";

import { z } from "zod";

const diagnosticSpanSchema = z.object({
  offset: z.number().int().nonnegative(),
  length: z.number().int().nonnegative(),
});
const diagnosticLabelSchema = z.object({ span: diagnosticSpanSchema });
const lintReturnDiagnosticSchema = z.object({
  code: z.string(),
  severity: z.enum(["error", "warning"]),
  filename: z.string(),
  labels: z.array(diagnosticLabelSchema),
});
const lintDiagnosticsSchema = z.object({
  diagnostics: z.array(lintReturnDiagnosticSchema),
});

/** Lint return type diagnostics retain byte offsets from the linter's JSON boundary. */
export type LintReturnTypeDiagnostic = z.infer<typeof lintReturnDiagnosticSchema>;

/** Validate lint JSON once at the process output boundary. */
export function parseLintReturnTypeDiagnostics(
  output: string,
): readonly LintReturnTypeDiagnostic[] {
  return lintDiagnosticsSchema.parse(JSON.parse(output)).diagnostics;
}

/** Read lint diagnostics even when findings produce the normal nonzero lint status. */
export function readLintReturnTypeDiagnostics(
  command: string,
  args: readonly string[],
  projectRoot: string,
): readonly LintReturnTypeDiagnostic[] {
  const result = spawnSync(command, [...args], {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 30_000,
  });
  if (result.error !== undefined) {
    throw new Error("Return type lint process failed to start", { cause: result.error });
  }
  if (result.signal !== null || (result.status !== 0 && result.status !== 1)) {
    throw new Error(
      `Return type lint process failed: ${result.status ?? result.signal ?? "unknown status"}`,
    );
  }
  return parseLintReturnTypeDiagnostics(result.stdout);
}
