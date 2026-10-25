import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
export function Card({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-5 rounded-lg border border-border bg-card py-5 text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}
export function CardHeader({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-header"
      className={cn("grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-5", className)}
      {...props}
    />
  );
}
export function CardTitle({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-title"
      className={cn("text-base leading-6 font-semibold text-balance", className)}
      {...props}
    />
  );
}
export function CardDescription({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-description"
      className={cn("col-start-1 text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}
export function CardAction({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start", className)}
      {...props}
    />
  );
}
export function CardContent({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return <div data-slot="card-content" className={cn("px-5", className)} {...props} />;
}
export function CardFooter({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-3 px-5", className)}
      {...props}
    />
  );
}
