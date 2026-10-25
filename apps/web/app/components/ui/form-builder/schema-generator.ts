import { jsonSchemaPropertySchema, uiSchemaElementSchema } from "./form-schema-contracts";
import type {
  FormField,
  FormBuilderState,
  GeneratedSchemas,
  JsonSchemaProperty,
  UiSchemaElement,
  DataSchema,
  FormJsonValue,
} from "./types";

/**
 * Converts a single field to its JSON Schema property definition.
 */
export function fieldToSchemaProperty(field: FormField): JsonSchemaProperty {
  const base = {
    type: "string",
    title: field.label,
    ...(field.description !== undefined &&
      field.description.length > 0 && { description: field.description }),
  } satisfies JsonSchemaProperty;

  switch (field.fieldType) {
    case "text": {
      return { ...base, type: "string" };
    }

    case "textarea": {
      return { ...base, type: "string" };
    }

    case "number": {
      return {
        ...base,
        type: "number",
        ...(field.options?.minimum !== undefined && { minimum: field.options.minimum }),
        ...(field.options?.maximum !== undefined && { maximum: field.options.maximum }),
      };
    }

    case "integer": {
      return {
        ...base,
        type: "integer",
        ...(field.options?.minimum !== undefined && { minimum: field.options.minimum }),
        ...(field.options?.maximum !== undefined && { maximum: field.options.maximum }),
      };
    }

    case "slider": {
      const min = field.options?.minimum;
      const max = field.options?.maximum;
      const defaultValue = field.options?.defaultValue ?? min;
      return {
        ...base,
        type: "number",
        minimum: min,
        maximum: max,
        default: defaultValue,
      };
    }

    case "email": {
      return { ...base, type: "string", format: "email" };
    }

    case "boolean": {
      return { ...base, type: "boolean" };
    }

    case "date": {
      return { ...base, type: "string", format: "date" };
    }

    case "time": {
      return { ...base, type: "string", format: "time" };
    }

    case "datetime": {
      return { ...base, type: "string", format: "date-time" };
    }

    case "select": {
      return {
        ...base,
        type: "string",
        enum: field.options?.enumValues ?? [],
      };
    }

    case "unsupported": {
      if (field.options?.rawJsonSchema !== undefined && field.options.rawJsonSchema.length > 0) {
        try {
          const parsed = jsonSchemaPropertySchema.safeParse(
            JSON.parse(field.options.rawJsonSchema),
          );
          if (parsed.success) {
            return parsed.data;
          }
        } catch {
          return base;
        }
      }
      return base;
    }

    case "label": {
      return base;
    }
  }
  return base;
}

/**
 * Converts a single field to its UI Schema control element.
 */
export function fieldToUiSchemaElement(field: FormField): UiSchemaElement {
  if (field.fieldType === "label") {
    return {
      type: "Label",
      text: field.label,
    };
  }

  if (
    field.fieldType === "unsupported" &&
    field.options?.rawUiSchema !== undefined &&
    field.options.rawUiSchema.length > 0
  ) {
    try {
      const parsed = uiSchemaElementSchema.safeParse(JSON.parse(field.options.rawUiSchema));
      if (parsed.success) {
        return parsed.data;
      }
    } catch {
      // Ignore invalid UI schema JSON and fall back to default control.
    }
  }

  const options: Record<string, FormJsonValue> = {};

  if (field.fieldType === "textarea") {
    options.multi = true;
  }

  if (field.fieldType === "slider") {
    options.slider = true;
  }

  if (field.options?.placeholder !== undefined && field.options.placeholder.length > 0) {
    options.placeholder = field.options.placeholder;
  }

  return {
    type: "Control",
    scope: `#/properties/${field.fieldName}`,
    ...(Object.keys(options).length > 0 && { options }),
  };
}

/**
 * Generates JSON Schema and UI Schema from form builder state.
 */
export function generateSchemas(state: FormBuilderState): GeneratedSchemas {
  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];
  const uiElements: UiSchemaElement[] = [];

  for (const field of state.fields) {
    if (field.fieldType === "label") {
      uiElements.push(fieldToUiSchemaElement(field));
      continue;
    }

    if (!field.fieldName) {
      continue;
    }

    properties[field.fieldName] = fieldToSchemaProperty(field);

    if (field.required) {
      required.push(field.fieldName);
    }

    uiElements.push(fieldToUiSchemaElement(field));
  }

  const dataSchema: DataSchema = {
    type: "object",
    properties,
    ...(required.length > 0 && { required }),
  };

  const uiSchema: UiSchemaElement = {
    type: "VerticalLayout",
    elements: uiElements,
  };

  return { dataSchema, uiSchema };
}

/**
 * Generates a valid field name from a label.
 * Converts to lowercase, replaces non-alphanumeric with underscore.
 */
export function labelToFieldName(label: string): string {
  return (
    label
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "_")
      .replaceAll(/^_+|_+$/g, "")
      .replaceAll(/_+/g, "_") || "field"
  );
}

/**
 * Ensures a field name is unique within the form.
 * Appends a number suffix if the name already exists.
 */
export function ensureUniqueFieldName(baseName: string, existingNames: readonly string[]): string {
  let name = baseName;
  let counter = 1;

  while (existingNames.includes(name)) {
    name = `${baseName}_${counter}`;
    counter++;
  }

  return name;
}
