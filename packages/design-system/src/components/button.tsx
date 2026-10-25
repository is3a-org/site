import { Button as Primitive } from "@base-ui/react/button";
import type { JSX } from "react";

import { cn } from "../cn";
import { focus, type StyledProps } from "../control-styles";

const tones = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-white hover:bg-destructive/90 dark:text-primary-foreground",
  outline: "border border-input bg-background hover:bg-accent",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};
const sizes = {
  default: "min-h-10 px-4 py-2",
  sm: "min-h-10 px-3 py-1.5 text-xs",
  lg: "min-h-12 px-6 py-3",
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
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
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
