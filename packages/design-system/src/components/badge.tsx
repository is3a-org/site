import { useRender } from "@base-ui/react/use-render";
import type { JSX } from "react";

import { cn } from "../cn";
import { display } from "../control-styles";
const tones = {
  // Ink tag, like the logo's black bracket.
  default: "bg-ink text-background",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  destructive: "bg-destructive-muted text-destructive",
  outline: "border border-current text-foreground",
};
export function Badge({
  render,
  ref,
  className,
  variant = "default",
  ...props
}: useRender.ComponentProps<"span"> & { variant?: keyof typeof tones }): JSX.Element {
  return useRender({
    defaultTagName: "span",
    render,
    ref,
    props: {
      ...props,
      "data-slot": "badge",
      className: cn(
        "inline-flex w-fit items-center gap-1 rounded-sm px-1.5 py-0.5 text-[0.8125rem] leading-4 [&_svg]:size-3",
        display,
        tones[variant],
        className,
      ),
    },
  });
}
