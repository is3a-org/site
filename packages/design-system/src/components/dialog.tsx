import { Dialog as Primitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
import { popup, type StyledProps } from "../control-styles";
import { Button } from "./button";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;
export const DialogPortal = Primitive.Portal;
export function DialogOverlay({
  className,
  ...props
}: StyledProps<Primitive.Backdrop.Props>): JSX.Element {
  return (
    <Primitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "absolute inset-0 z-50 bg-black/45 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}
export function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: StyledProps<Primitive.Popup.Props> & { showCloseButton?: boolean }): JSX.Element {
  return (
    <Primitive.Portal>
      <DialogOverlay />
      <Primitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-6 overflow-y-auto p-6",
          popup,
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Primitive.Close
            render={<Button variant="ghost" size="icon" />}
            aria-label="Close dialog"
            className="absolute top-2 right-2"
          >
            <X />
          </Primitive.Close>
        )}
      </Primitive.Popup>
    </Primitive.Portal>
  );
}
export function DialogHeader({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 pr-8", className)}
      {...props}
    />
  );
}
export function DialogFooter({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
export function DialogTitle({
  className,
  ...props
}: StyledProps<Primitive.Title.Props>): JSX.Element {
  return (
    <Primitive.Title
      data-slot="dialog-title"
      className={cn("text-2xl leading-7 font-semibold font-display text-balance", className)}
      {...props}
    />
  );
}
export function DialogDescription({
  className,
  ...props
}: StyledProps<Primitive.Description.Props>): JSX.Element {
  return (
    <Primitive.Description
      data-slot="dialog-description"
      className={cn("text-sm leading-relaxed text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}
