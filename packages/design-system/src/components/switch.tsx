import { Switch as Primitive } from "@base-ui/react/switch";
import type { JSX } from "react";

import { cn } from "../cn";
import { focus, type StyledProps } from "../control-styles";
export function Switch({ className, ...props }: StyledProps<Primitive.Root.Props>): JSX.Element {
  return (
    <Primitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-input p-0.5 transition-colors after:absolute after:-inset-y-2 data-checked:bg-primary data-disabled:opacity-50",
        focus,
        className,
      )}
      {...props}
    >
      <Primitive.Thumb className="size-5 rounded-full bg-white shadow-sm transition-transform duration-150 data-checked:translate-x-5 motion-reduce:transition-none" />
    </Primitive.Root>
  );
}
