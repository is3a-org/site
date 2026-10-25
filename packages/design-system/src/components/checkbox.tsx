import { Checkbox as Primitive } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";
import type { JSX } from "react";

import { cn } from "../cn";
import { focus, type StyledProps } from "../control-styles";
export function Checkbox({
  className,
  indeterminate,
  ...props
}: StyledProps<Primitive.Root.Props>): JSX.Element {
  return (
    <Primitive.Root
      data-slot="checkbox"
      indeterminate={indeterminate}
      className={cn(
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-sm border-2 border-input bg-background text-primary-foreground transition-colors after:absolute after:-inset-2 hover:border-foreground data-checked:border-primary data-checked:bg-primary data-disabled:opacity-50 data-indeterminate:border-primary data-indeterminate:bg-primary",
        focus,
        className,
      )}
      {...props}
    >
      <Primitive.Indicator>
        {indeterminate === true ? <Minus className="size-3.5" /> : <Check className="size-3.5" />}
      </Primitive.Indicator>
    </Primitive.Root>
  );
}
