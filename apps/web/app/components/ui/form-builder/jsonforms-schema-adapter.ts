import { z } from "zod";

import { createAjv } from "@jsonforms/core";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

import { formJsonObjectSchema, uiSchemaElementSchema } from "./form-schema-contracts";
import type { DataSchema, UiSchemaElement } from "./types";

const jsonFormsValidator = createAjv();
const jsonFormsDataSchema = z.custom<JsonSchema>((value) => {
  const parsed = formJsonObjectSchema.safeParse(value);
  if (!parsed.success) {
    return false;
  }
  try {
    return jsonFormsValidator.validateSchema(parsed.data) === true;
  } catch {
    return false;
  }
});

/** Copy builder schemas into the mutable schema contract validated by JSON Forms' own AJV. */
export function toJsonFormsDataSchema(schema: DataSchema): JsonSchema {
  return jsonFormsDataSchema.parse(structuredClone(schema));
}

/** Copy UI schema data into the JSON Forms renderer contract without freezing builder state. */
export function toJsonFormsUiSchema(schema: UiSchemaElement): UISchemaElement {
  return uiSchemaElementSchema.parse(structuredClone(schema));
}
