import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
import { display } from "../control-styles";
const tones = {
  default: "border-border bg-muted text-foreground",
  success: "border-success/25 bg-success-muted text-success",
  warning: "border-warning/25 bg-warning-muted text-warning",
  destructive: "border-destructive/25 bg-destructive-muted text-destructive",
};
/** Inline message. Add role="alert" when it appears in response to an action. */
export function Alert({
  className,
  variant = "default",
  ...props
}: ComponentProps<"div"> & { variant?: keyof typeof tones }): JSX.Element {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      className={cn(
        // A leading icon takes the first column; text always starts in the second.
        "grid grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[1rem_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5",
        tones[variant],
        className,
      )}
      {...props}
    />
  );
}
export function AlertTitle({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 text-[0.9375rem] leading-5", display, className)}
      {...props}
    />
  );
}
export function AlertDescription({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="alert-description"
      className={cn("col-start-2 leading-relaxed [&_p+p]:mt-2", className)}
      {...props}
    />
  );
}
