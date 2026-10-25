import { Popover as Primitive } from "@base-ui/react/popover";
import type { JSX } from "react";

import { cn } from "../cn";
import { popup, type StyledProps } from "../control-styles";
export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverClose = Primitive.Close;
export function PopoverContent({
  className,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  ...props
}: StyledProps<Primitive.Popup.Props> &
  Pick<Primitive.Positioner.Props, "side" | "align" | "sideOffset">): JSX.Element {
  return (
    <Primitive.Portal>
      <Primitive.Positioner side={side} align={align} sideOffset={sideOffset} className="z-50">
        <Primitive.Popup
          data-slot="popover-content"
          className={cn("w-80 max-w-(--available-width) p-4", popup, className)}
          {...props}
        />
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}
