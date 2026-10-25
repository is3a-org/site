import { Tooltip as Primitive } from "@base-ui/react/tooltip";
import type { JSX } from "react";

import { cn } from "../cn";
import type { StyledProps } from "../control-styles";
export const TooltipProvider = Primitive.Provider;
export const Tooltip = Primitive.Root;
export const TooltipTrigger = Primitive.Trigger;
export function TooltipContent({
  className,
  side = "top",
  align = "center",
  sideOffset = 6,
  hidden,
  ...props
}: StyledProps<Primitive.Popup.Props> &
  Pick<Primitive.Positioner.Props, "side" | "align" | "sideOffset">): JSX.Element | undefined {
  if (hidden === true) {
    return undefined;
  }
  return (
    <Primitive.Portal>
      <Primitive.Positioner side={side} align={align} sideOffset={sideOffset} className="z-50">
        <Primitive.Popup
          data-slot="tooltip-content"
          className={cn(
            // Hide on close rather than waiting for unmount, which needs an animation frame that
            // throttled or embedded browsers may not deliver.
            "max-w-64 rounded-md bg-foreground px-3 py-2 text-xs leading-relaxed text-background shadow-md data-closed:hidden",
            className,
          )}
          {...props}
        />
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}
