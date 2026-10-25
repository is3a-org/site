/** Shared IS3A interaction vocabulary. Components own their structure and state styling. */
export type StyledProps<Props> = Props & { readonly className?: string };

/** Keyboard focus: a square ink outline, drawn with the same 2px stroke as the bracket. */
export const focus =
  "outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid";
export const control =
  "min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground hover:border-foreground focus-visible:border-ink focus-visible:shadow-[inset_0_0_0_1px_var(--ink)] disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[inset_0_0_0_1px_var(--destructive)]";
export const popup =
  "rounded-lg border border-foreground/15 bg-popover text-popover-foreground shadow-[0_2px_4px_-2px_rgb(0_0_0/0.08),0_16px_32px_-12px_rgb(0_0_0/0.24)] outline-none origin-(--transform-origin) transition-[opacity,transform] duration-150 ease-out data-starting-style:opacity-0 data-ending-style:pointer-events-none data-ending-style:opacity-0 data-starting-style:scale-96 data-ending-style:scale-96 motion-reduce:transition-none";
export const menuItem =
  "relative flex min-h-10 cursor-default items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0";
/** Condensed, logo-width type for titles and labels that name a thing. */
export const display = "font-display font-semibold";
