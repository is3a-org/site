import { Tabs as Primitive } from "@base-ui/react/tabs";
import type { JSX } from "react";

import { cn } from "../cn";
import { focus, type StyledProps } from "../control-styles";
export function Tabs({ className, ...props }: StyledProps<Primitive.Root.Props>): JSX.Element {
  return (
    <Primitive.Root data-slot="tabs" className={cn("flex flex-col gap-5", className)} {...props} />
  );
}
export function TabsList({ className, ...props }: StyledProps<Primitive.List.Props>): JSX.Element {
  return (
    <Primitive.List
      data-slot="tabs-list"
      className={cn("flex w-fit max-w-full gap-1 border-b border-border", className)}
      {...props}
    />
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
        "min-h-10 border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-active:border-primary data-active:text-primary data-disabled:opacity-40",
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
