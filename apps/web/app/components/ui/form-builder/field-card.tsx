import { Button } from "@is3a/design-system/button";
import { Card, CardContent } from "@is3a/design-system/card";
import { Input } from "@is3a/design-system/input";
import { Label } from "@is3a/design-system/label";
import { Switch } from "@is3a/design-system/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@is3a/design-system/tooltip";
import { ChevronUp, ChevronDown, Copy, Trash2 } from "lucide-react";
import type { JSX } from "react";

import { cn } from "@/lib/utils";

import { getFieldTypeConfig } from "./constants";
import { FieldOptions } from "./field-options";
import { FieldTypeSelector } from "./field-type-selector";
import type { FormField, FieldType } from "./types";

export interface FieldCardProps {
  field: FormField;
  index: number;
  onUpdate: (updates: Partial<Omit<FormField, "id">>) => void;
  onUpdateLabel: (label: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  className?: string;
}

export function FieldCard({
  field,
  index,
  onUpdate,
  onUpdateLabel,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  className,
}: FieldCardProps): JSX.Element {
  const handleTypeChange = (fieldType: FieldType): void => {
    const typeConfig = getFieldTypeConfig(fieldType);
    onUpdate({
      fieldType,
      options: typeConfig?.defaultOptions ? { ...typeConfig.defaultOptions } : undefined,
    });
  };

  return (
    <Card data-slot="field-card" className={cn("relative", className)}>
      <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-medium text-muted-foreground">
        Field {index + 1}
      </div>

      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`field-label-${field.id}`}>Label</Label>
              <Input
                id={`field-label-${field.id}`}
                value={field.label}
                onChange={(e) => onUpdateLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <FieldTypeSelector value={field.fieldType} onChange={handleTypeChange} />
            </div>
          </div>

          {field.fieldType !== "unsupported" && field.fieldType !== "label" && (
            <div className="space-y-2">
              <Label htmlFor={`field-description-${field.id}`}>
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id={`field-description-${field.id}`}
                value={field.description ?? ""}
                onChange={(e) => onUpdate({ description: e.target.value || undefined })}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            {field.fieldType !== "unsupported" && field.fieldType !== "label" ? (
              <div className="flex items-center gap-2">
                <Switch
                  id={`field-required-${field.id}`}
                  checked={field.required}
                  onCheckedChange={(checked) => onUpdate({ required: checked })}
                />
                <Label htmlFor={`field-required-${field.id}`} className="cursor-pointer">
                  Required
                </Label>
              </div>
            ) : (
              <div />
            )}

            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={onMoveUp}
                      disabled={!onMoveUp}
                    >
                      <ChevronUp className="size-4" />
                      <span className="sr-only">Move up</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Move up</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={onMoveDown}
                      disabled={!onMoveDown}
                    >
                      <ChevronDown className="size-4" />
                      <span className="sr-only">Move down</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Move down</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={onDuplicate}
                    >
                      <Copy className="size-4" />
                      <span className="sr-only">Duplicate</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={onDelete}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          <FieldOptions
            fieldType={field.fieldType}
            options={field.options}
            onChange={(options) => onUpdate({ options })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
