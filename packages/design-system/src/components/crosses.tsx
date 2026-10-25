import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";

// One St. Andrew's cross from Amsterdam's coat of arms, drawn on a 12-unit grid.
const crossPath =
  "M2.25 0 6 3.75 9.75 0 12 2.25 8.25 6 12 9.75 9.75 12 6 8.25 2.25 12 0 9.75 3.75 6 0 2.25Z";

/** The three crosses (XXX) from the IS3A logo, stacked like the logo or in a row like the flag. */
export function Crosses({
  className,
  orientation = "horizontal",
  ...props
}: ComponentProps<"svg"> & { orientation?: "horizontal" | "vertical" }): JSX.Element {
  const vertical = orientation === "vertical";
  return (
    <svg
      aria-hidden="true"
      viewBox={vertical ? "0 0 12 44" : "0 0 44 12"}
      data-slot="crosses"
      className={cn("shrink-0 fill-current", vertical ? "h-6 w-auto" : "h-auto w-6", className)}
      {...props}
    >
      {[0, 16, 32].map((offset) => (
        <path
          key={offset}
          d={crossPath}
          transform={vertical ? `translate(0 ${offset})` : `translate(${offset} 0)`}
        />
      ))}
    </svg>
  );
}

/** Loading state: the crosses light up one after another. Reduced motion shows them still. */
export function CrossesLoader({
  className,
  label = "Loading",
  ...props
}: ComponentProps<"output"> & { label?: string }): JSX.Element {
  return (
    // Output is a polite live region, so screen readers announce the label.
    <output
      data-slot="crosses-loader"
      className={cn("inline-flex items-center gap-1 text-primary", className)}
      {...props}
    >
      {[0, 400, 800].map((delay) => (
        <svg
          key={delay}
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="size-2.5 fill-current motion-safe:animate-cross"
          style={{ animationDelay: `${delay}ms` }}
        >
          <path d={crossPath} />
        </svg>
      ))}
      <span className="sr-only">{label}</span>
    </output>
  );
}

/** Section break with the crosses between two rules. Decorative; use headings for structure. */
export function CrossesDivider({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      aria-hidden="true"
      data-slot="crosses-divider"
      className={cn("flex items-center gap-4 text-ink", className)}
      {...props}
    >
      <span className="h-0.5 flex-1 bg-ink" />
      <Crosses className="w-8" />
      <span className="h-0.5 flex-1 bg-ink" />
    </div>
  );
}
