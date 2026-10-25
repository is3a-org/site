import { Select as Primitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import type { JSX } from "react";

import { cn } from "../cn";
import { control, focus, menuItem, popup, type StyledProps } from "../control-styles";

export const Select = Primitive.Root;
export const SelectGroup = Primitive.Group;
export const SelectValue = Primitive.Value;
export function SelectTrigger({
  className,
  children,
  ...props
}: StyledProps<Primitive.Trigger.Props>): JSX.Element {
  return (
    <Primitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex w-full items-center justify-between gap-3 data-placeholder:text-muted-foreground",
        control,
        focus,
        className,
      )}
      {...props}
    >
      {children}
      <Primitive.Icon>
        <ChevronDown className="size-4 opacity-60" />
      </Primitive.Icon>
    </Primitive.Trigger>
  );
}
export function SelectContent({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  ...props
}: StyledProps<Primitive.Popup.Props> &
  Pick<Primitive.Positioner.Props, "side" | "align" | "sideOffset">): JSX.Element {
  return (
    <Primitive.Portal>
      <Primitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignItemWithTrigger={false}
        className="z-50"
      >
        <Primitive.Popup
          data-slot="select-content"
          className={cn(
            "max-w-(--available-width) min-w-(--anchor-width) overflow-hidden p-1",
            popup,
            className,
          )}
          {...props}
        >
          <Primitive.ScrollUpArrow className="py-1 text-center text-xs">▲</Primitive.ScrollUpArrow>
          <Primitive.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto">
            {children}
          </Primitive.List>
          <Primitive.ScrollDownArrow className="py-1 text-center text-xs">
            ▼
          </Primitive.ScrollDownArrow>
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}
export function SelectItem({
  className,
  children,
  ...props
}: StyledProps<Primitive.Item.Props>): JSX.Element {
  return (
    <Primitive.Item data-slot="select-item" className={cn(menuItem, "pr-9", className)} {...props}>
      <Primitive.ItemText>{children}</Primitive.ItemText>
      <Primitive.ItemIndicator className="absolute right-3">
        <Check className="size-4" />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  );
}
export function SelectLabel({
  className,
  ...props
}: StyledProps<Primitive.GroupLabel.Props>): JSX.Element {
  return (
    <Primitive.GroupLabel
      className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  );
}
export function SelectSeparator({
  className,
  ...props
}: StyledProps<Primitive.Separator.Props>): JSX.Element {
  return <Primitive.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;
}
