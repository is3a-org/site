/** Shared IS3A interaction vocabulary. Components own their structure and state styling. */
export type StyledProps<Props> = Props & { readonly className?: string };

export const focus =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
export const control =
  "min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50 aria-invalid:border-destructive";
export const popup =
  "rounded-lg border border-border bg-popover text-popover-foreground shadow-lg outline-none origin-(--transform-origin) transition-[opacity,transform] duration-150 data-starting-style:opacity-0 data-ending-style:pointer-events-none data-ending-style:opacity-0 data-starting-style:scale-95 data-ending-style:scale-95 motion-reduce:transition-none";
export const menuItem =
  "relative flex min-h-10 cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0";
