import { describe, expect, it } from "vite-plus/test";

import { generatedSchemasSchema, jsonSchemaPropertySchema } from "./form-schema-contracts";
import { generateSchemas } from "./schema-generator";
import { parseSchemas } from "./schema-parser";

const controls = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/amount",
      options: { slider: true, placeholder: "Amount" },
    },
  ],
};

describe("form schema JSON boundaries", () => {
  it("preserves unsupported schema keywords and custom UI element types without freezing", () => {
    const definition = {
      dataSchema: {
        type: "object",
        properties: {
          amount: {
            oneOf: [
              { const: 1, title: "One" },
              { const: 2, title: "Two" },
            ],
            default: 1,
          },
        },
      },
      uiSchema: {
        type: "Categorization",
        elements: [{ type: "Category", label: "Amounts", elements: controls.elements }],
      },
    };
    const parsed = generatedSchemasSchema.parse(definition);
    expect(parsed).toEqual(definition);
    expect(Object.isFrozen(parsed)).toBe(false);
    expect(Object.isFrozen(parsed.uiSchema.elements)).toBe(false);
    expect(generateSchemas(parseSchemas(parsed))).toEqual(
      definition.dataSchema.type === "object"
        ? {
            dataSchema: { type: "object", properties: definition.dataSchema.properties },
            uiSchema: { type: "VerticalLayout", elements: controls.elements },
          }
        : definition,
    );
  });

  it("preserves numeric enum values and schemas with references or union types", () => {
    expect(
      jsonSchemaPropertySchema.parse({
        enum: [1, 2],
        $ref: "#/definitions/choice",
        type: ["number", "null"],
      }),
    ).toEqual({ enum: [1, 2], $ref: "#/definitions/choice", type: ["number", "null"] });
  });

  it("accepts numeric slider defaults and string placeholders from parsed JSON", () => {
    const fields = parseSchemas(
      generatedSchemasSchema.parse({
        dataSchema: { type: "object", properties: { amount: { type: "number", default: 0 } } },
        uiSchema: controls,
      }),
    ).fields;
    expect(fields.at(0)?.options?.defaultValue).toBe(0);
    expect(fields.at(0)?.options?.placeholder).toBe("Amount");
  });

  it("does not interpret other JSON variants as slider defaults or placeholders", () => {
    const fields = parseSchemas(
      generatedSchemasSchema.parse({
        dataSchema: { type: "object", properties: { amount: { type: "number", default: "0" } } },
        uiSchema: {
          type: "Control",
          scope: "#/properties/amount",
          options: { slider: true, placeholder: 12 },
        },
      }),
    ).fields;
    expect(fields.at(0)?.options?.defaultValue).toBeUndefined();
    expect(fields.at(0)?.options?.placeholder).toBeUndefined();
  });
});

it("roundtrips Boolean property and item schemas through unsupported builder fields", () => {
  const definition = {
    dataSchema: {
      type: "object",
      properties: {
        allowed: true,
        forbidden: false,
        list: { type: "array", items: false },
        tuple: { type: "array", items: [true, false] },
      },
    },
    uiSchema: {
      type: "VerticalLayout",
      elements: ["allowed", "forbidden", "list", "tuple"].map((name) => ({
        type: "Control",
        scope: `#/properties/${name}`,
      })),
    },
  };
  const parsed = generatedSchemasSchema.parse(definition);
  expect(generateSchemas(parseSchemas(parsed))).toEqual(definition);
  expect(jsonSchemaPropertySchema.parse(true)).toBe(true);
  expect(jsonSchemaPropertySchema.parse(false)).toBe(false);
});
