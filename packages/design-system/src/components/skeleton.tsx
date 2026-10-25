import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
export function Skeleton({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}
