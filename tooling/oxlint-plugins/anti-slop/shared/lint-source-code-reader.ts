import type { SourceCode } from "vite-plus/lint/plugins";

/** Lint source code readers expose host methods while keeping mutable host state private. */
export type LintSourceCodeReader = Readonly<
  Pick<SourceCode, "getText" | "getScope" | "isGlobalReference" | "getCommentsBefore">
>;
