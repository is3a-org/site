import { Separator as Primitive } from "@base-ui/react/separator";
import type { JSX } from "react";

import { cn } from "../cn";
import type { StyledProps } from "../control-styles";
export function Separator({ className, ...props }: StyledProps<Primitive.Props>): JSX.Element {
  return (
    <Primitive
      data-slot="separator"
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}
