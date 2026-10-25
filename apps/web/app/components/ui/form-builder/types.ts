/** Parsed JSON values used by form definitions and submission data. */
export type FormJsonValue =
  | string
  | number
  | boolean
  | null
  | readonly FormJsonValue[]
  | FormJsonObject;

/** Parsed JSON objects preserve arbitrary named fields without accepting unparsed values. */
export interface FormJsonObject {
  readonly [key: string]: FormJsonValue;
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "integer"
  | "slider"
  | "email"
  | "boolean"
  | "date"
  | "time"
  | "datetime"
  | "select"
  | "label"
  | "unsupported";

/**
 * Type-specific configuration options for a field.
 */
export interface FieldOptions {
  /** Options for select/dropdown fields */
  readonly enumValues?: readonly string[];
  /** Minimum value for number/integer fields */
  readonly minimum?: number;
  /** Maximum value for number/integer fields */
  readonly maximum?: number;
  /** Default value for slider fields */
  readonly defaultValue?: number;
  /** Placeholder text for text/textarea fields */
  readonly placeholder?: string;
  /** Raw JSON Schema for unsupported field types */
  readonly rawJsonSchema?: string;
  /** Raw UI Schema for unsupported field types */
  readonly rawUiSchema?: string;
}

/**
 * Represents a single field in the form builder.
 */
export interface FormField {
  /** Unique identifier for this field */
  readonly id: string;
  /** Property name in the generated JSON Schema */
  readonly fieldName: string;
  /** Display label for the field */
  readonly label: string;
  /** Optional help text / description */
  readonly description?: string;
  /** The type of field */
  readonly fieldType: FieldType;
  /** Whether the field is required */
  readonly required: boolean;
  /** Type-specific options */
  readonly options?: FieldOptions;
}

/**
 * State of the form builder.
 */
export interface FormBuilderState {
  readonly fields: readonly FormField[];
}

/**
 * JSON Schema property definition (subset of JSON Schema).
 */
export type JsonSchemaProperty = boolean | JsonSchemaObject;

/** JSON Schema object fields remain available to the builder while Boolean subschemas stay intact. */
export interface JsonSchemaObject {
  readonly type?: string | readonly string[];
  readonly title?: string;
  readonly description?: string;
  readonly format?: string;
  readonly enum?: readonly FormJsonValue[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly default?: FormJsonValue;
  /** Nested properties for object types */
  readonly properties?: Readonly<Record<string, JsonSchemaProperty>>;
  /** Required fields for object types */
  readonly required?: readonly string[];
  /** Items schema for array types */
  readonly items?: JsonSchemaProperty | readonly JsonSchemaProperty[];
}

/**
 * JSON Schema for the form data.
 */
export type DataSchema = JsonSchemaObject;

/**
 * UI Schema element (Control or Layout).
 */
export interface UiSchemaElement {
  readonly type: string;
  readonly scope?: string;
  readonly elements?: readonly UiSchemaElement[];
  readonly options?: FormJsonObject;
  /** Text content for Label elements */
  readonly text?: string;
}

/**
 * Generated schemas from the form builder.
 */
export interface GeneratedSchemas {
  readonly dataSchema: DataSchema;
  readonly uiSchema: UiSchemaElement;
}
