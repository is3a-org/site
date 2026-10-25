import type { ComponentProps, JSX } from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "../cn";
import type { Button } from "./button";
import { buttonVariants } from "./button";

/** DayPicker supplies calendar navigation until Base UI offers a calendar primitive. */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  buttonVariant = "ghost",
  ...props
}: ComponentProps<typeof DayPicker> & {
  buttonVariant?: ComponentProps<typeof Button>["variant"];
}): JSX.Element {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-6 sm:flex-row",
        month: "space-y-3",
        month_caption: "flex h-10 items-center justify-center px-12 text-sm font-semibold",
        nav: "absolute inset-x-0 top-0 flex justify-between",
        button_previous: buttonVariants({ variant: buttonVariant, size: "icon" }),
        button_next: buttonVariants({ variant: buttonVariant, size: "icon" }),
        chevron: "size-4 fill-current",
        month_grid: "border-collapse",
        weekdays: "text-muted-foreground",
        weekday: "size-10 text-xs font-normal",
        day: "size-10 p-0 text-center text-sm",
        day_button: cn(buttonVariants({ variant: "ghost", size: "icon" }), "font-normal"),
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground",
        today: "[&>button]:ring-1 [&>button]:ring-primary",
        outside: "text-muted-foreground opacity-50",
        disabled: "opacity-30",
        hidden: "invisible",
        range_start: "rounded-l-md bg-accent",
        range_end: "rounded-r-md bg-accent",
        range_middle:
          "bg-accent [&>button]:rounded-none [&>button]:bg-accent [&>button]:text-accent-foreground",
        dropdowns: "flex items-center gap-2",
        dropdown_root: "relative",
        dropdown: "absolute inset-0 opacity-0",
        ...classNames,
      }}
      {...props}
    />
  );
}
