import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@is3a/design-system/select";
import type { JSX } from "react";

import { FIELD_TYPES } from "./constants";
import type { FieldType } from "./types";

export interface FieldTypeSelectorProps {
  readonly value: FieldType;
  readonly onChange: (type: FieldType) => void;
}

export function FieldTypeSelector({ value, onChange }: FieldTypeSelectorProps): JSX.Element {
  return (
    <Select
      value={value}
      onValueChange={(selected) => {
        const fieldType = FIELD_TYPES.find((option) => option.type === selected);
        if (fieldType !== undefined) {
          onChange(fieldType.type);
        }
      }}
    >
      <SelectTrigger data-slot="field-type-selector" className="w-[180px]">
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent>
        {FIELD_TYPES.map((fieldType) => {
          const Icon = fieldType.icon;
          return (
            <SelectItem key={fieldType.type} value={fieldType.type}>
              <span className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span>{fieldType.label}</span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
