import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
export function Label({ className, htmlFor, ...props }: ComponentProps<"label">): JSX.Element {
  return (
    <label
      htmlFor={htmlFor}
      data-slot="label"
      className={cn(
        "inline-flex items-center gap-2 text-sm leading-5 font-medium peer-disabled:opacity-50 peer-data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
