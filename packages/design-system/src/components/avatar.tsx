import { Avatar as Primitive } from "@base-ui/react/avatar";
import type { JSX } from "react";

import { cn } from "../cn";
import type { StyledProps } from "../control-styles";
export function Avatar({ className, ...props }: StyledProps<Primitive.Root.Props>): JSX.Element {
  return (
    <Primitive.Root
      data-slot="avatar"
      className={cn(
        "relative inline-flex size-10 shrink-0 overflow-hidden rounded-full bg-secondary",
        className,
      )}
      {...props}
    />
  );
}
export function AvatarImage({
  className,
  ...props
}: StyledProps<Primitive.Image.Props>): JSX.Element {
  return (
    <Primitive.Image
      data-slot="avatar-image"
      className={cn("size-full object-cover", className)}
      {...props}
    />
  );
}
export function AvatarFallback({
  className,
  ...props
}: StyledProps<Primitive.Fallback.Props>): JSX.Element {
  return (
    <Primitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center text-sm font-semibold text-secondary-foreground",
        className,
      )}
      {...props}
    />
  );
}
