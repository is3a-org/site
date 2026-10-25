import { z } from "zod";

import { formJsonValueSchema } from "~/components/ui/form-builder/form-schema-contracts";
import type {
  DataSchema,
  FormJsonObject,
  FormJsonValue,
  JsonSchemaProperty,
  UiSchemaElement,
} from "~/components/ui/form-builder/types";

/** A submitted value as the dashboard shows it: a link for emails and URLs, text otherwise. */
export type SubmissionDisplayValue =
  | Readonly<{ kind: "empty" }>
  | Readonly<{ kind: "text"; text: string }>
  | Readonly<{ kind: "link"; text: string; href: string }>;

export interface SubmissionField {
  readonly key: string;
  readonly title: string;
  readonly format: string | undefined;
}

const scopePrefix = "#/properties/";

function controlKeys(element: UiSchemaElement | undefined): string[] {
  if (element === undefined) {
    return [];
  }
  const own =
    element.type === "Control" && element.scope?.startsWith(scopePrefix) === true
      ? [element.scope.slice(scopePrefix.length)]
      : [];
  return [...own, ...(element.elements ?? []).flatMap((child) => controlKeys(child))];
}

/** "graduationYear" and "graduation_year" both read as "Graduation year". */
function humanize(key: string): string {
  const words = key
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Lists the fields to show for a form's submissions: in layout order, then any schema fields the
 * layout leaves out, then keys only found in the data (from older versions of the form).
 */
export function submissionFields(
  dataSchema: DataSchema | undefined,
  uiSchema: UiSchemaElement | undefined,
  submissions: readonly Readonly<{ data: FormJsonObject }>[],
): SubmissionField[] {
  const properties = dataSchema?.properties ?? {};
  const keys = new Set([
    ...controlKeys(uiSchema).filter((key) => key in properties),
    ...Object.keys(properties),
    ...submissions.flatMap((submission) => Object.keys(submission.data)),
  ]);
  const schemaEntries = new Map<string, JsonSchemaProperty>(Object.entries(properties));
  return [...keys].map((key) => {
    // JSON Schema also allows `true` or `false` as a property's schema; those have no title.
    // Keys found only in submissions have no schema entry.
    const entry = schemaEntries.get(key);
    const property = entry === undefined || entry === true || entry === false ? undefined : entry;
    return {
      key,
      title: property?.title ?? humanize(key),
      format: property?.format,
    };
  });
}

const booleanValue = z.boolean();
const listValue = z.array(formJsonValueSchema);
const scalarValue = z.union([z.string(), z.number()]);
const stringValue = z.string();

function valueText(value: FormJsonValue): string {
  const flag = booleanValue.safeParse(value);
  if (flag.success) {
    return flag.data ? "Yes" : "No";
  }
  const list = listValue.safeParse(value);
  if (list.success) {
    return list.data.map((item) => valueText(item)).join(", ");
  }
  const scalar = scalarValue.safeParse(value);
  return scalar.success ? String(scalar.data) : JSON.stringify(value);
}

const urlPattern = /^https?:\/\//i;

/** Formats one submitted value for display, linking emails and web addresses. */
export function displaySubmissionValue(
  value: FormJsonValue | undefined,
  field: SubmissionField,
): SubmissionDisplayValue {
  if (value === undefined || value === null || value === "") {
    return { kind: "empty" };
  }
  const text = valueText(value);
  const string = stringValue.safeParse(value);
  if (string.success && field.format === "email") {
    return { kind: "link", text, href: `mailto:${string.data}` };
  }
  if (string.success && urlPattern.test(string.data)) {
    return { kind: "link", text, href: string.data };
  }
  return { kind: "text", text };
}
