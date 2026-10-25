import type { JSX } from "react";

import { cn } from "../cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  );
}

export { Skeleton };
