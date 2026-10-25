import { Field as Primitive } from "@base-ui/react/field";
import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
import type { StyledProps } from "../control-styles";
import { Label } from "./label";
import { Separator } from "./separator";

export const FieldItem = Primitive.Item;

export function FieldSet({ className, ...props }: ComponentProps<"fieldset">): JSX.Element {
  return <fieldset className={cn("flex min-w-0 flex-col gap-5", className)} {...props} />;
}
export function FieldLegend({
  className,
  variant = "legend",
  ...props
}: ComponentProps<"legend"> & { variant?: "legend" | "label" }): JSX.Element {
  return (
    <legend
      className={cn(
        "mb-4 font-semibold",
        variant === "label" ? "text-sm" : "text-xl font-display",
        className,
      )}
      {...props}
    />
  );
}
export function FieldGroup({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return <div className={cn("@container/fields flex flex-col gap-6", className)} {...props} />;
}
export function Field({
  className,
  orientation = "vertical",
  ...props
}: StyledProps<Primitive.Root.Props> & {
  orientation?: "vertical" | "horizontal" | "responsive";
}): JSX.Element {
  return (
    <Primitive.Root
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        "group/field flex gap-2 text-left",
        orientation === "horizontal" ? "flex-row items-center gap-3" : "flex-col",
        orientation === "responsive" && "@md/fields:flex-row @md/fields:items-center",
        className,
      )}
      {...props}
    />
  );
}
export function FieldLabel({ className, ...props }: ComponentProps<typeof Label>): JSX.Element {
  return (
    <Label
      data-slot="field-label"
      className={cn("group-data-disabled/field:opacity-50", className)}
      {...props}
    />
  );
}
export function FieldContent({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return <div className={cn("flex flex-1 flex-col gap-1.5", className)} {...props} />;
}
export function FieldTitle({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return <div className={cn("text-sm font-medium", className)} {...props} />;
}
export function FieldDescription({ className, ...props }: ComponentProps<"p">): JSX.Element {
  return (
    <p className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />
  );
}
export function FieldSeparator({
  className,
  children,
  ...props
}: ComponentProps<"div">): JSX.Element {
  return (
    <div
      className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}
      {...props}
    >
      <Separator className="flex-1" />
      {children}
      {Boolean(children) && <Separator className="flex-1" />}
    </div>
  );
}
export function FieldError({
  className,
  children,
  errors,
  ...props
}: ComponentProps<"div"> & { errors?: readonly (Readonly<{ message?: string }> | undefined)[] }):
  | JSX.Element
  | undefined {
  const messages = [...new Set(errors?.map((error) => error?.message).filter(Boolean))];
  const hasContent = Boolean(children);
  if (!hasContent && messages.length === 0) {
    return undefined;
  }
  return (
    <div role="alert" className={cn("text-sm text-destructive", className)} {...props}>
      {hasContent ? children : messages.join(" ")}
    </div>
  );
}
