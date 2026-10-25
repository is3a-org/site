import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
import { control, focus } from "../control-styles";
export function Textarea({ className, ...props }: ComponentProps<"textarea">): JSX.Element {
  return (
    <textarea
      data-slot="textarea"
      className={cn("min-h-28 w-full resize-y", control, focus, className)}
      {...props}
    />
  );
}
