import { Collapsible as Primitive } from "@base-ui/react/collapsible";
import type { JSX } from "react";

import { cn } from "../cn";
import type { StyledProps } from "../control-styles";
export const Collapsible = Primitive.Root;
export const CollapsibleTrigger = Primitive.Trigger;
export function CollapsibleContent({
  className,
  ...props
}: StyledProps<Primitive.Panel.Props>): JSX.Element {
  return (
    <Primitive.Panel
      data-slot="collapsible-content"
      className={cn(
        "h-(--collapsible-panel-height) overflow-hidden transition-[height,opacity] duration-150 data-ending-style:h-0 data-ending-style:opacity-0 data-starting-style:h-0 data-starting-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}
