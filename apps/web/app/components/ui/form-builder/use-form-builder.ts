import { useState, useCallback, useMemo } from "react";

import { getFieldTypeConfig } from "./constants";
import { generateSchemas, labelToFieldName, ensureUniqueFieldName } from "./schema-generator";
import { parseSchemas } from "./schema-parser";
import type { FormField, FormBuilderState, FieldType, GeneratedSchemas } from "./types";

/**
 * Generates a unique ID for a field.
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Hook for managing form builder state.
 */
export interface UseFormBuilderOptions {
  /** Initial state for the form builder (takes precedence over initialSchemas) */
  readonly initialState?: Partial<FormBuilderState>;
  /** Initialize from existing schemas (parsed into FormBuilderState) */
  readonly initialSchemas?: GeneratedSchemas;
  readonly onChange?: (schemas: GeneratedSchemas) => void;
}

/** Form builder state, generated schemas, and operations for editing fields. */
export interface FormBuilderController {
  readonly state: FormBuilderState;
  readonly schemas: GeneratedSchemas;
  readonly addField: (fieldType?: FieldType) => string;
  readonly updateField: (id: string, updates: Readonly<Partial<Omit<FormField, "id">>>) => void;
  readonly deleteField: (id: string) => void;
  readonly moveField: (fromIndex: number, toIndex: number) => void;
  readonly duplicateField: (id: string) => string | undefined;
  readonly updateFieldNameFromLabel: (id: string, label: string) => void;
}

/** Manages form builder fields and calls onChange with regenerated schemas. */
export function useFormBuilder(options: UseFormBuilderOptions = {}): FormBuilderController {
  const { initialState, initialSchemas, onChange } = options;
  const [state, setState] = useState<FormBuilderState>(() => {
    const initialFields = initialState?.fields;
    if (initialFields !== undefined && initialFields.length > 0) {
      return { fields: initialFields };
    }
    if (initialSchemas) {
      return parseSchemas(initialSchemas);
    }
    return { fields: [] };
  });

  const updateState = useCallback(
    (nextState: FormBuilderState) => {
      setState(nextState);
      onChange?.(generateSchemas(nextState));
    },
    [onChange],
  );

  const existingFieldNames = useMemo(() => state.fields.map((f) => f.fieldName), [state.fields]);

  const addField = useCallback(
    (fieldType: FieldType = "text") => {
      const typeConfig = getFieldTypeConfig(fieldType);
      const label = "Untitled Field";
      const fieldName = ensureUniqueFieldName(labelToFieldName(label), existingFieldNames);

      const newField: FormField = {
        id: generateId(),
        fieldName,
        label,
        fieldType,
        required: false,
        options: typeConfig?.defaultOptions ? { ...typeConfig.defaultOptions } : undefined,
      };

      updateState({
        ...state,
        fields: [...state.fields, newField],
      });

      return newField.id;
    },
    [state, existingFieldNames, updateState],
  );

  const updateField = useCallback(
    (id: string, updates: Partial<Omit<FormField, "id">>) => {
      updateState({
        ...state,
        fields: state.fields.map((field) => (field.id === id ? { ...field, ...updates } : field)),
      });
    },
    [state, updateState],
  );

  const deleteField = useCallback(
    (id: string) => {
      updateState({
        ...state,
        fields: state.fields.filter((field) => field.id !== id),
      });
    },
    [state, updateState],
  );

  const moveField = useCallback(
    (fromIndex: number, toIndex: number) => {
      const fields = [...state.fields];
      const [removed] = fields.splice(fromIndex, 1);
      fields.splice(toIndex, 0, removed);
      updateState({ ...state, fields });
    },
    [state, updateState],
  );

  const duplicateField = useCallback(
    (id: string): string | undefined => {
      const field = state.fields.find((f) => f.id === id);
      let duplicatedFieldId: string | undefined;
      if (field !== undefined) {
        const newFieldName = ensureUniqueFieldName(field.fieldName, existingFieldNames);

        const newField: FormField = {
          ...field,
          id: generateId(),
          fieldName: newFieldName,
          label: `${field.label} (copy)`,
          options: field.options ? { ...field.options } : undefined,
        };

        const index = state.fields.findIndex((f) => f.id === id);
        const fields = [...state.fields];
        fields.splice(index + 1, 0, newField);
        updateState({ ...state, fields });

        duplicatedFieldId = newField.id;
      }
      return duplicatedFieldId;
    },
    [state, existingFieldNames, updateState],
  );

  /**
   * Updates the field name based on the label, ensuring uniqueness.
   */
  const updateFieldNameFromLabel = useCallback(
    (id: string, label: string) => {
      const otherFieldNames = state.fields.filter((f) => f.id !== id).map((f) => f.fieldName);

      const baseName = labelToFieldName(label);
      const fieldName = ensureUniqueFieldName(baseName, otherFieldNames);

      updateState({
        ...state,
        fields: state.fields.map((field) =>
          field.id === id ? { ...field, label, fieldName } : field,
        ),
      });
    },
    [state, updateState],
  );

  const schemas: GeneratedSchemas = useMemo(() => generateSchemas(state), [state]);

  return {
    state,
    schemas,
    addField,
    updateField,
    deleteField,
    moveField,
    duplicateField,
    updateFieldNameFromLabel,
  };
}
