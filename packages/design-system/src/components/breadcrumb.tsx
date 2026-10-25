import { useRender } from "@base-ui/react/use-render";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
import { focus } from "../control-styles";
export function Breadcrumb(props: ComponentProps<"nav">): JSX.Element {
  return <nav aria-label="Breadcrumb" {...props} />;
}
export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">): JSX.Element {
  return (
    <ol
      className={cn("flex flex-wrap items-center gap-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">): JSX.Element {
  return <li className={cn("inline-flex items-center gap-2", className)} {...props} />;
}
export function BreadcrumbLink({
  render,
  ref,
  className,
  ...props
}: useRender.ComponentProps<"a">): JSX.Element {
  return useRender({
    defaultTagName: "a",
    render,
    ref,
    props: {
      ...props,
      className: cn(
        "rounded-sm underline-offset-4 hover:text-primary hover:underline",
        focus,
        className,
      ),
    },
  });
}
export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">): JSX.Element {
  return (
    <span aria-current="page" className={cn("font-medium text-foreground", className)} {...props} />
  );
}
export function BreadcrumbSeparator({ children, ...props }: ComponentProps<"li">): JSX.Element {
  return (
    <li role="presentation" aria-hidden="true" {...props}>
      {children ?? <ChevronRight className="size-3.5" />}
    </li>
  );
}
export function BreadcrumbEllipsis(props: ComponentProps<"span">): JSX.Element {
  return (
    <span aria-hidden="true" {...props}>
      <MoreHorizontal className="size-4" />
    </span>
  );
}
