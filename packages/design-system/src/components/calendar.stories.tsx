import type { ReactElement } from "react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import type { Meta } from "@storybook/react-vite";

import { Calendar } from "./calendar";

const meta = { title: "Controls/Calendar" } satisfies Meta;
export default meta;

const initialDate = new Date(2026, 9, 24);
export function SingleDate(): ReactElement {
  const [selected, setSelected] = useState<Date | undefined>(initialDate);
  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={setSelected}
      defaultMonth={initialDate}
      today={initialDate}
      className="rounded-md border"
    />
  );
}
export function Range(): ReactElement {
  const [range, setRange] = useState<DateRange | undefined>({
    from: initialDate,
    to: new Date(2026, 9, 28),
  });
  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      defaultMonth={initialDate}
      today={initialDate}
      numberOfMonths={2}
      className="rounded-md border"
    />
  );
}
