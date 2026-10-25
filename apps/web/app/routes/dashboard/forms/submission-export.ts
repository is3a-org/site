import type { FormJsonObject, FormJsonValue } from "~/components/ui/form-builder/types";

function isSubmissionArray(value: FormJsonValue): value is readonly FormJsonValue[] {
  return Array.isArray(value);
}

function isSubmissionObject(value: FormJsonValue): value is FormJsonObject {
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: this discriminates an already decoded JSON union; arrays and null are separate JSON variants.
  return value !== null && typeof value === "object" && !isSubmissionArray(value);
}

/** Preserve the export's dotted object paths and leave array cells intact. */
export function flattenSubmission(data: FormJsonObject, prefix = ""): FormJsonObject {
  const flattened: Record<string, FormJsonValue> = {};
  for (const [key, value] of Object.entries(data)) {
    const column = prefix === "" ? key : `${prefix}.${key}`;
    if (isSubmissionObject(value)) {
      Object.assign(flattened, flattenSubmission(value, column));
    } else {
      flattened[column] = value;
    }
  }
  return flattened;
}

/** Match JavaScript's existing cell coercion, including nested arrays and blank null values. */
export function formatSubmissionCell(value?: FormJsonValue): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (isSubmissionArray(value)) {
    return value.map((element) => formatSubmissionCell(element)).join(",");
  }
  if (isSubmissionObject(value)) {
    return "[object Object]";
  }
  return String(value);
}

function escapeSubmissionCell(value: FormJsonValue | undefined): string {
  const text = formatSubmissionCell(value);
  return text.includes(",") || text.includes('"') || text.includes("\n")
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

/** Export selected columns in their displayed order, with RFC-style CSV escaping. */
export function generateSubmissionCsv(
  data: readonly FormJsonObject[],
  columns: readonly string[],
): string {
  const header = columns.map((column) => escapeSubmissionCell(column)).join(",");
  const rows = data.map((row) =>
    columns.map((column) => escapeSubmissionCell(row[column])).join(","),
  );
  return [header, ...rows].join("\n");
}
