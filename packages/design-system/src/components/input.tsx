import { Input as Primitive } from "@base-ui/react/input";
import type { JSX } from "react";

import { cn } from "../cn";
import { control, focus, type StyledProps } from "../control-styles";
export function Input({ className, ...props }: StyledProps<Primitive.Props>): JSX.Element {
  return (
    <Primitive
      data-slot="input"
      className={cn("w-full min-w-0", control, focus, className)}
      {...props}
    />
  );
}
