import { Slider as Primitive } from "@base-ui/react/slider";
import type { JSX } from "react";

import { cn } from "../cn";
import { focus, type StyledProps } from "../control-styles";
export function Slider({
  className,
  value,
  defaultValue = [0],
  ...props
}: StyledProps<Primitive.Root.Props<readonly number[]>>): JSX.Element {
  return (
    <Primitive.Root
      data-slot="slider"
      value={value}
      defaultValue={defaultValue}
      className={cn("w-full data-disabled:opacity-50", className)}
      {...props}
    >
      <Primitive.Control className="relative flex min-h-10 w-full touch-none items-center select-none data-[orientation=vertical]:h-48 data-[orientation=vertical]:w-10 data-[orientation=vertical]:justify-center">
        <Primitive.Track className="h-1.5 w-full rounded-full bg-input data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5">
          <Primitive.Indicator className="rounded-full bg-primary" />
          {(value ?? defaultValue).map((_, index) => (
            <Primitive.Thumb
              key={index}
              index={index}
              aria-label={props["aria-label"]}
              aria-labelledby={props["aria-labelledby"]}
              aria-describedby={props["aria-describedby"]}
              className={cn(
                "size-5 rounded-full border-2 border-primary bg-background shadow-sm",
                focus,
              )}
            />
          ))}
        </Primitive.Track>
      </Primitive.Control>
    </Primitive.Root>
  );
}
