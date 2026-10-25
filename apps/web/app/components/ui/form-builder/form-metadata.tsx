import { Input } from "@is3a/design-system/input";
import { Label } from "@is3a/design-system/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@is3a/design-system/select";
import type { JSX } from "react";

import type { FormStatus as FormsFragmentStatus } from "@fragno-dev/forms";

import { cn } from "@/lib/utils";

export type FormStatus = FormsFragmentStatus;

export interface FormMetadata {
  readonly title: string;
  readonly description: string;
  readonly status: FormStatus;
}

export interface FormMetadataEditorProps {
  readonly value: FormMetadata;
  readonly onChange: (metadata: FormMetadata) => void;
  readonly className?: string;
}

const STATUS_OPTIONS: { value: FormStatus; label: string; description: string }[] = [
  { value: "draft", label: "Draft", description: "Not accepting submissions" },
  { value: "open", label: "Open", description: "Accepting submissions" },
  { value: "closed", label: "Closed", description: "No longer accepting submissions" },
];

export function FormMetadataEditor({
  value,
  onChange,
  className,
}: FormMetadataEditorProps): JSX.Element {
  const updateField = <K extends keyof FormMetadata>(key: K, fieldValue: FormMetadata[K]): void => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <div data-slot="form-metadata-editor" className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="form-title">Form Title</Label>
        <Input
          id="form-title"
          value={value.title}
          onChange={(e) => {
            updateField("title", e.target.value);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="form-description">
          Description <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="form-description"
          value={value.description}
          onChange={(e) => {
            updateField("description", e.target.value);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="form-status">Status</Label>
        <Select
          value={value.status}
          onValueChange={(selected) => {
            const status = STATUS_OPTIONS.find((option) => option.value === selected);
            if (status !== undefined) {
              updateField("status", status.value);
            }
          }}
        >
          <SelectTrigger id="form-status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
