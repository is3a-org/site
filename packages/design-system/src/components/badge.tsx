import { useRender } from "@base-ui/react/use-render";
import type { JSX } from "react";

import { cn } from "../cn";
const tones = {
  default: "bg-primary/10 text-primary",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive/10 text-destructive",
  outline: "border border-border text-foreground",
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
        "inline-flex w-fit items-center gap-1 rounded px-2 py-1 text-xs font-semibold [&_svg]:size-3",
        tones[variant],
        className,
      ),
    },
  });
}
