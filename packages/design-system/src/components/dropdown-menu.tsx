import { Menu } from "@base-ui/react/menu";
import { Check, ChevronRight } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
import { menuItem, popup, type StyledProps } from "../control-styles";
export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuPortal = Menu.Portal;
export const DropdownMenuGroup = Menu.Group;
export const DropdownMenuRadioGroup = Menu.RadioGroup;
export const DropdownMenuSub = Menu.SubmenuRoot;
export function DropdownMenuContent({
  className,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  ...props
}: StyledProps<Menu.Popup.Props> &
  Pick<Menu.Positioner.Props, "side" | "align" | "sideOffset">): JSX.Element {
  return (
    <Menu.Portal>
      <Menu.Positioner side={side} align={align} sideOffset={sideOffset} className="z-50">
        <Menu.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "max-h-(--available-height) max-w-(--available-width) min-w-48 overflow-y-auto p-1",
            popup,
            className,
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  );
}
export function DropdownMenuItem({
  className,
  variant = "default",
  inset = false,
  ...props
}: StyledProps<Menu.Item.Props> & {
  variant?: "default" | "destructive";
  inset?: boolean;
}): JSX.Element {
  return (
    <Menu.Item
      data-slot="dropdown-menu-item"
      className={cn(
        menuItem,
        inset && "pl-9",
        variant === "destructive" &&
          "text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive",
        className,
      )}
      {...props}
    />
  );
}
export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: StyledProps<Menu.CheckboxItem.Props>): JSX.Element {
  return (
    <Menu.CheckboxItem className={cn(menuItem, "pl-9", className)} {...props}>
      <Menu.CheckboxItemIndicator className="absolute left-3">
        <Check />
      </Menu.CheckboxItemIndicator>
      {children}
    </Menu.CheckboxItem>
  );
}
export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: StyledProps<Menu.RadioItem.Props>): JSX.Element {
  return (
    <Menu.RadioItem className={cn(menuItem, "pl-9", className)} {...props}>
      <Menu.RadioItemIndicator className="absolute left-3">
        <Check />
      </Menu.RadioItemIndicator>
      {children}
    </Menu.RadioItem>
  );
}
export function DropdownMenuLabel({
  className,
  inset = false,
  ...props
}: ComponentProps<"div"> & { inset?: boolean }): JSX.Element {
  return (
    <div
      className={cn(
        "px-3 py-2 text-xs font-semibold text-muted-foreground",
        inset && "pl-9",
        className,
      )}
      {...props}
    />
  );
}
export function DropdownMenuSeparator({
  className,
  ...props
}: StyledProps<Menu.Separator.Props>): JSX.Element {
  return <Menu.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;
}
export function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">): JSX.Element {
  return <span className={cn("ml-auto text-xs text-muted-foreground", className)} {...props} />;
}
export function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: StyledProps<Menu.SubmenuTrigger.Props>): JSX.Element {
  return (
    <Menu.SubmenuTrigger className={cn(menuItem, className)} {...props}>
      {children}
      <ChevronRight className="ml-auto" />
    </Menu.SubmenuTrigger>
  );
}
export function DropdownMenuSubContent(
  props: ComponentProps<typeof DropdownMenuContent>,
): JSX.Element {
  return <DropdownMenuContent side="right" align="start" {...props} />;
}
