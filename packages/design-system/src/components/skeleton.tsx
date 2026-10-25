import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
export function Skeleton({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-sm bg-secondary motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}
