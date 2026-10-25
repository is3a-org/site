import { Dialog as Primitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { cn } from "../cn";
import type { StyledProps } from "../control-styles";
import { Button } from "./button";
import { DialogOverlay } from "./dialog";
export {
  DialogTitle as SheetTitle,
  DialogDescription as SheetDescription,
  DialogOverlay as SheetOverlay,
} from "./dialog";

export const Sheet = Primitive.Root;
export const SheetTrigger = Primitive.Trigger;
export const SheetClose = Primitive.Close;
export const SheetPortal = Primitive.Portal;
const edges = {
  right:
    "inset-y-0 right-0 h-dvh w-[min(24rem,90vw)] border-l data-starting-style:translate-x-full data-ending-style:translate-x-full",
  left: "inset-y-0 left-0 h-dvh w-[min(24rem,90vw)] border-r data-starting-style:-translate-x-full data-ending-style:-translate-x-full",
  top: "inset-x-0 top-0 max-h-[90dvh] border-b data-starting-style:-translate-y-full data-ending-style:-translate-y-full",
  bottom:
    "inset-x-0 bottom-0 max-h-[90dvh] border-t data-starting-style:translate-y-full data-ending-style:translate-y-full",
};
export function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: StyledProps<Primitive.Popup.Props> & { side?: keyof typeof edges }): JSX.Element {
  return (
    <Primitive.Portal>
      <DialogOverlay />
      <Primitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-6 overflow-y-auto border-border bg-background p-6 shadow-xl transition-transform duration-200 ease-out outline-none motion-reduce:transition-none",
          edges[side],
          className,
        )}
        {...props}
      >
        {children}
        <Primitive.Close
          render={<Button variant="ghost" size="icon" />}
          aria-label="Close panel"
          className="absolute top-2 right-2"
        >
          <X />
        </Primitive.Close>
      </Primitive.Popup>
    </Primitive.Portal>
  );
}
export function SheetHeader({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return <div className={cn("flex flex-col gap-2 pr-8", className)} {...props} />;
}
export function SheetFooter({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 border-t border-border pt-4", className)}
      {...props}
    />
  );
}
