import { z } from "zod";

import type {
  FormField,
  FormBuilderState,
  GeneratedSchemas,
  JsonSchemaProperty,
  JsonSchemaObject,
  UiSchemaElement,
  FieldType,
  FieldOptions,
  FormJsonObject,
} from "./types";

/**
 * Extracts the field name from a UI Schema control scope.
 * E.g., "#/properties/email" -> "email"
 */
function extractFieldNameFromScope(scope: string): string | undefined {
  return /^#\/properties\/(.+)$/.exec(scope)?.[1];
}

/**
 * Recursively collects all Control and Label elements from a UI schema tree.
 * Supports nested layouts (VerticalLayout, HorizontalLayout, Group, etc.)
 */
function collectUiElements(element: UiSchemaElement): UiSchemaElement[] {
  const elements: UiSchemaElement[] = [];

  if (element.type === "Control" || element.type === "Label") {
    elements.push(element);
  }

  if (element.elements) {
    for (const child of element.elements) {
      elements.push(...collectUiElements(child));
    }
  }

  return elements;
}

/**
 * Converts a fieldName to a human-readable label.
 * E.g., "user_email" -> "User Email"
 */
function fieldNameToLabel(fieldName: string): string {
  return fieldName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Checks if a JSON Schema property type is supported by the form builder.
 */
function isSupportedType(type: JsonSchemaObject["type"]): boolean {
  return type === "string" || type === "number" || type === "integer" || type === "boolean";
}

/**
 * Infers the FieldType from a JSON Schema property and UI Schema options.
 * Returns "unsupported" for types that can't be represented in the builder.
 */
function inferFieldType(prop: JsonSchemaProperty, uiOptions?: FormJsonObject): FieldType {
  if (prop === true || prop === false) {
    return "unsupported";
  }
  if (!isSupportedType(prop.type)) {
    return "unsupported";
  }

  if (uiOptions?.multi === true && prop.type === "string") {
    return "textarea";
  }

  if (uiOptions?.slider === true && (prop.type === "number" || prop.type === "integer")) {
    return "slider";
  }

  if (prop.type === "string" && prop.enum && prop.enum.length > 0) {
    return z.array(z.string()).safeParse(prop.enum).success ? "select" : "unsupported";
  }

  if (prop.type === "string" && prop.format !== undefined && prop.format.length > 0) {
    switch (prop.format) {
      case "email": {
        return "email";
      }
      case "date": {
        return "date";
      }
      case "time": {
        return "time";
      }
      case "date-time": {
        return "datetime";
      }
      default: {
        return "unsupported";
      }
    }
  }

  switch (prop.type) {
    case "string": {
      return "text";
    }
    case "number": {
      return "number";
    }
    case "integer": {
      return "integer";
    }
    case "boolean": {
      return "boolean";
    }
    case undefined: {
      return "unsupported";
    }
    default: {
      return "unsupported";
    }
  }
}

/**
 * Parses a single JSON Schema property into a FormField.
 */
function parseSchemaProperty(
  fieldName: string,
  prop: JsonSchemaProperty,
  uiElement?: UiSchemaElement,
  isRequired?: boolean,
): FormField {
  const uiOptions = uiElement?.options;
  const fieldType = inferFieldType(prop, uiOptions);
  const property = prop === true || prop === false ? undefined : prop;
  const options: { -readonly [Key in keyof FieldOptions]: FieldOptions[Key] } = {};

  if (fieldType === "unsupported") {
    options.rawJsonSchema = JSON.stringify(prop, undefined, 2);
    if (uiElement) {
      options.rawUiSchema = JSON.stringify(uiElement, undefined, 2);
    }
  }

  if (property?.enum && property.enum.length > 0) {
    const enumValues = z.array(z.string()).safeParse(property.enum);
    if (enumValues.success) {
      options.enumValues = enumValues.data;
    }
  }

  if (property?.minimum !== undefined) {
    options.minimum = property.minimum;
  }

  if (property?.maximum !== undefined) {
    options.maximum = property.maximum;
  }

  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: Parsed JSON renderer options contain a JSON union; placeholder accepts only its string member.
  if (typeof uiOptions?.placeholder === "string" && uiOptions.placeholder.length > 0) {
    options.placeholder = uiOptions.placeholder;
  }

  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: A parsed JSON Schema default is a JSON union; slider defaults accept its number member.
  if (fieldType === "slider" && typeof property?.default === "number") {
    options.defaultValue = property.default;
  }

  return {
    id: crypto.randomUUID(),
    fieldName,
    label: property?.title ?? fieldNameToLabel(fieldName),
    description: property?.description,
    fieldType,
    required: isRequired ?? false,
    options: Object.keys(options).length > 0 ? options : undefined,
  };
}

/**
 * Parses GeneratedSchemas back into FormBuilderState.
 * This is the inverse of generateSchemas.
 */
export function parseSchemas(schemas: GeneratedSchemas): FormBuilderState {
  const { dataSchema, uiSchema } = schemas;
  const fields: FormField[] = [];
  const properties = dataSchema.properties ?? {};
  const allElements = collectUiElements(uiSchema);
  const requiredFields = new Set(dataSchema.required);
  const propertyNamesInUi = new Set<string>();
  const usedLabelNames = new Set(Object.keys(properties));
  let labelIndex = 1;

  const createLabelFieldName = (): string => {
    let candidate = `label_${labelIndex}`;
    while (usedLabelNames.has(candidate)) {
      labelIndex += 1;
      candidate = `label_${labelIndex}`;
    }
    usedLabelNames.add(candidate);
    labelIndex += 1;
    return candidate;
  };

  for (const element of allElements) {
    if (element.type === "Label") {
      fields.push({
        id: crypto.randomUUID(),
        fieldName: createLabelFieldName(),
        label: element.text ?? "Label",
        fieldType: "label",
        required: false,
      });
      continue;
    }

    if (element.scope !== undefined && element.scope.length > 0) {
      const fieldName = extractFieldNameFromScope(element.scope);
      const prop =
        fieldName !== undefined && fieldName.length > 0 ? properties[fieldName] : undefined;
      if (fieldName === undefined || fieldName.length === 0 || prop === undefined) {
        continue;
      }

      propertyNamesInUi.add(fieldName);
      fields.push(parseSchemaProperty(fieldName, prop, element, requiredFields.has(fieldName)));
    }
  }

  for (const fieldName of Object.keys(properties)) {
    if (!propertyNamesInUi.has(fieldName)) {
      const prop = properties[fieldName];
      fields.push(parseSchemaProperty(fieldName, prop, undefined, requiredFields.has(fieldName)));
    }
  }

  return { fields };
}
