import { Radio } from "@base-ui/react/radio";
import { RadioGroup as Group } from "@base-ui/react/radio-group";
import type { JSX } from "react";

import { cn } from "../cn";
import { focus, type StyledProps } from "../control-styles";
export function RadioGroup({ className, ...props }: StyledProps<Group.Props<string>>): JSX.Element {
  return <Group data-slot="radio-group" className={cn("grid gap-3", className)} {...props} />;
}
export function RadioGroupItem({
  className,
  ...props
}: StyledProps<Radio.Root.Props<string>>): JSX.Element {
  return (
    <Radio.Root
      data-slot="radio-group-item"
      className={cn(
        "relative flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-input bg-background transition-colors after:absolute after:-inset-2 hover:border-foreground data-checked:border-primary data-disabled:opacity-50",
        focus,
        className,
      )}
      {...props}
    >
      <Radio.Indicator className="size-2.5 rounded-full bg-primary" />
    </Radio.Root>
  );
}
