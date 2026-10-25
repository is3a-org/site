import { Tabs as Primitive } from "@base-ui/react/tabs";
import type { JSX } from "react";

import { cn } from "../cn";
import { display, focus, type StyledProps } from "../control-styles";
export function Tabs({ className, ...props }: StyledProps<Primitive.Root.Props>): JSX.Element {
  return (
    <Primitive.Root data-slot="tabs" className={cn("flex flex-col gap-5", className)} {...props} />
  );
}
export function TabsList({
  className,
  children,
  ...props
}: StyledProps<Primitive.List.Props>): JSX.Element {
  return (
    <Primitive.List
      data-slot="tabs-list"
      className={cn("relative flex w-fit max-w-full gap-1", className)}
      {...props}
    >
      {children}
      {/* The bracket travels to the selected tab, like the logo's [ around the crosses. */}
      <Primitive.Indicator className="bracket pointer-events-none absolute top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) transition-[left,width] duration-200 ease-out motion-reduce:transition-none" />
    </Primitive.List>
  );
}
export function TabsTrigger({
  className,
  ...props
}: StyledProps<Primitive.Tab.Props>): JSX.Element {
  return (
    <Primitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "min-h-10 px-4 py-2 text-base text-muted-foreground transition-colors hover:text-foreground data-active:text-foreground data-disabled:opacity-40",
        display,
        focus,
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({
  className,
  ...props
}: StyledProps<Primitive.Panel.Props>): JSX.Element {
  return (
    <Primitive.Panel
      data-slot="tabs-content"
      className={cn("min-w-0", focus, className)}
      {...props}
    />
  );
}
