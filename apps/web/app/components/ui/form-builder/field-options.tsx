import { Input } from "@is3a/design-system/input";
import { Label } from "@is3a/design-system/label";
import { Textarea } from "@is3a/design-system/textarea";
import type { JSX } from "react";

import { cn } from "@/lib/utils";

import { getFieldTypeConfig } from "./constants";
import { EnumValuesEditor } from "./enum-values-editor";
import type { FieldType, FieldOptions as FieldOptionsType } from "./types";

export interface FieldOptionsProps {
  readonly fieldType: FieldType;
  readonly options: FieldOptionsType | undefined;
  readonly onChange: (options: FieldOptionsType) => void;
  readonly className?: string;
}

export function FieldOptions({
  fieldType,
  options,
  onChange,
  className,
}: FieldOptionsProps): JSX.Element | undefined {
  const updateOption = <K extends keyof FieldOptionsType>(
    key: K,
    value: FieldOptionsType[K],
  ): void => {
    onChange({ ...options, [key]: value });
  };

  if (fieldType === "label") {
    return undefined;
  }

  if (fieldType === "select") {
    return (
      <div data-slot="field-options" className={cn("border-t pt-4", className)}>
        <EnumValuesEditor
          values={options?.enumValues ?? ["Option 1"]}
          onChange={(enumValues) => {
            updateOption("enumValues", enumValues);
          }}
        />
      </div>
    );
  }

  if (fieldType === "slider") {
    const defaults = getFieldTypeConfig("slider")?.defaultOptions;
    const defaultMin = defaults?.minimum ?? 1;
    const defaultMax = defaults?.maximum ?? 10;
    const defaultValue = defaults?.defaultValue ?? defaultMin;
    return (
      <div data-slot="field-options" className={cn("border-t pt-4", className)}>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-value" className="text-sm text-muted-foreground">
              Minimum
            </Label>
            <Input
              id="min-value"
              type="number"
              value={options?.minimum ?? defaultMin}
              onChange={(e) => {
                updateOption("minimum", Number(e.target.value) || defaultMin);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-value" className="text-sm text-muted-foreground">
              Default
            </Label>
            <Input
              id="default-value"
              type="number"
              value={options?.defaultValue ?? defaultValue}
              onChange={(e) => {
                updateOption("defaultValue", Number(e.target.value) || defaultValue);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-value" className="text-sm text-muted-foreground">
              Maximum
            </Label>
            <Input
              id="max-value"
              type="number"
              value={options?.maximum ?? defaultMax}
              onChange={(e) => {
                updateOption("maximum", Number(e.target.value) || defaultMax);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (fieldType === "number" || fieldType === "integer") {
    return (
      <div data-slot="field-options" className={cn("border-t pt-4", className)}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-value" className="text-sm text-muted-foreground">
              Minimum
            </Label>
            <Input
              id="min-value"
              type="number"
              placeholder="No minimum"
              value={options?.minimum ?? ""}
              onChange={(e) => {
                updateOption("minimum", e.target.value ? Number(e.target.value) : undefined);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-value" className="text-sm text-muted-foreground">
              Maximum
            </Label>
            <Input
              id="max-value"
              type="number"
              placeholder="No maximum"
              value={options?.maximum ?? ""}
              onChange={(e) => {
                updateOption("maximum", e.target.value ? Number(e.target.value) : undefined);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (fieldType === "text" || fieldType === "textarea") {
    return (
      <div data-slot="field-options" className={cn("border-t pt-4", className)}>
        <div className="space-y-2">
          <Label htmlFor="placeholder" className="text-sm text-muted-foreground">
            Placeholder
          </Label>
          <Input
            id="placeholder"
            placeholder="Enter placeholder text"
            value={options?.placeholder ?? ""}
            onChange={(e) => {
              updateOption("placeholder", e.target.value || undefined);
            }}
          />
        </div>
      </div>
    );
  }

  if (fieldType === "unsupported") {
    return (
      <div data-slot="field-options" className={cn("space-y-4 border-t pt-4", className)}>
        <div className="space-y-2">
          <Label htmlFor="raw-json-schema" className="text-sm text-muted-foreground">
            JSON Schema
          </Label>
          <Textarea
            id="raw-json-schema"
            className="font-mono text-xs"
            rows={6}
            placeholder="{}"
            value={options?.rawJsonSchema ?? "{}"}
            onChange={(e) => {
              updateOption("rawJsonSchema", e.target.value);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="raw-ui-schema" className="text-sm text-muted-foreground">
            UI Schema
          </Label>
          <Textarea
            id="raw-ui-schema"
            className="font-mono text-xs"
            rows={4}
            placeholder="{}"
            value={options?.rawUiSchema ?? "{}"}
            onChange={(e) => {
              updateOption("rawUiSchema", e.target.value);
            }}
          />
        </div>
      </div>
    );
  }

  return undefined;
}
