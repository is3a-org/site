import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
export function Table({ className, ...props }: ComponentProps<"table">): JSX.Element {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}
export function TableHeader({ className, ...props }: ComponentProps<"thead">): JSX.Element {
  return (
    <thead data-slot="table-header" className={cn("border-b-2 border-ink", className)} {...props} />
  );
}
export function TableBody({ className, ...props }: ComponentProps<"tbody">): JSX.Element {
  return (
    <tbody data-slot="table-body" className={cn("divide-y divide-border", className)} {...props} />
  );
}
export function TableFooter({ className, ...props }: ComponentProps<"tfoot">): JSX.Element {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t border-border bg-muted font-medium", className)}
      {...props}
    />
  );
}
export function TableRow({ className, ...props }: ComponentProps<"tr">): JSX.Element {
  return (
    <tr
      data-slot="table-row"
      className={cn("transition-colors hover:bg-muted aria-selected:bg-accent", className)}
      {...props}
    />
  );
}
export function TableHead({ className, ...props }: ComponentProps<"th">): JSX.Element {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 px-4 text-left text-sm font-semibold font-display text-foreground",
        className,
      )}
      {...props}
    />
  );
}
export function TableCell({ className, ...props }: ComponentProps<"td">): JSX.Element {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-4 py-3 align-middle tabular-nums", className)}
      {...props}
    />
  );
}
export function TableCaption({ className, ...props }: ComponentProps<"caption">): JSX.Element {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-3 text-left text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
