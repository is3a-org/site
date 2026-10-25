import { z } from "zod";

import type {
  DataSchema,
  FormJsonObject,
  FormJsonValue,
  GeneratedSchemas,
  JsonSchemaProperty,
  JsonSchemaObject,
  UiSchemaElement,
} from "./types";

/** Validate form JSON values recursively before they enter builder state. */
export const formJsonValueSchema: z.ZodType<FormJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(formJsonValueSchema),
    formJsonObjectSchema,
  ]),
);

/** Validate form JSON objects while retaining additional application fields. */
export const formJsonObjectSchema: z.ZodType<FormJsonObject> = z.record(
  z.string(),
  formJsonValueSchema,
);

const jsonPropertyTypeSchema = z.union([z.string(), z.array(z.string())]);
const uiElementTypeSchema = z.string();

/** Validate supported JSON Schema fields and retain additional JSON Schema keywords. */
export const jsonSchemaPropertySchema: z.ZodType<JsonSchemaProperty> = z.lazy(() =>
  z.union([z.boolean(), jsonSchemaObjectSchema]),
);

/** Validate JSON Schema objects while preserving Boolean property and item schemas. */
export const jsonSchemaObjectSchema: z.ZodType<JsonSchemaObject> = z.lazy(() =>
  z
    .object({
      type: jsonPropertyTypeSchema.optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      format: z.string().optional(),
      enum: z.array(formJsonValueSchema).optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      default: formJsonValueSchema.optional(),
      properties: z.record(z.string(), jsonSchemaPropertySchema).optional(),
      required: z.array(z.string()).optional(),
      items: z.union([jsonSchemaPropertySchema, z.array(jsonSchemaPropertySchema)]).optional(),
    })
    .catchall(formJsonValueSchema),
);

/** Validate UI Schema trees, including arbitrary JSON renderer options. */
export const uiSchemaElementSchema: z.ZodType<UiSchemaElement> = z.lazy(() =>
  z
    .object({
      type: uiElementTypeSchema,
      scope: z.string().optional(),
      elements: z.array(uiSchemaElementSchema).optional(),
      options: formJsonObjectSchema.optional(),
      text: z.string().optional(),
    })
    .catchall(formJsonValueSchema),
);

/** Validate the form builder's object data schema at its JSON boundary. */
export const dataSchemaSchema: z.ZodType<DataSchema> = jsonSchemaObjectSchema;

/** Validate both form schemas together before constructing builder state. */
export const generatedSchemasSchema: z.ZodType<GeneratedSchemas> = z.object({
  dataSchema: dataSchemaSchema,
  uiSchema: uiSchemaElementSchema,
});
