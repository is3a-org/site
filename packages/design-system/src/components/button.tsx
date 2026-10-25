import { Button as Primitive } from "@base-ui/react/button";
import type { JSX } from "react";

import { cn } from "../cn";
import { display, focus, type StyledProps } from "../control-styles";

const tones = {
  default: "bg-primary text-primary-foreground hover:bg-primary/88",
  // Red is also the brand, so danger is outlined until hovered rather than another red fill.
  destructive:
    "border-2 border-destructive text-destructive hover:bg-destructive hover:text-background",
  // Ink outline in the bracket's stroke weight; inverts on hover.
  outline: "border-2 border-ink text-foreground hover:bg-ink hover:text-background",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/60",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline decoration-primary/30 decoration-2 underline-offset-4 hover:decoration-primary",
};
const sizes = {
  default: "min-h-10 px-4 py-2 text-[0.9375rem]",
  sm: "min-h-10 px-3 py-1.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
  icon: "size-10",
  "icon-sm": "size-10",
  "icon-lg": "size-12",
};
interface ButtonAppearance {
  readonly variant?: keyof typeof tones;
  readonly size?: keyof typeof sizes;
  readonly className?: string;
}
export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: ButtonAppearance = {}): string {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md leading-none transition-[background-color,color,border-color,text-decoration-color,scale] duration-150 active:scale-96 disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 motion-reduce:active:scale-100 [&>svg]:size-4 [&>svg]:shrink-0",
    display,
    focus,
    tones[variant],
    sizes[size],
    className,
  );
}
export function Button({
  variant = "default",
  size = "default",
  className,
  ...props
}: StyledProps<Primitive.Props> & ButtonAppearance): JSX.Element {
  return (
    <Primitive
      // IS3A non-native buttons are navigation links. Callers can override role for other targets.
      role={props.nativeButton === false ? "link" : undefined}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
