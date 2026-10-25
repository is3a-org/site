import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "./select";

const meta = { title: "Controls/Select" } satisfies Meta;
export default meta;

export function Default(): ReactElement {
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="plan">Membership plan</Label>
      <Select
        defaultValue="full"
        items={{
          full: "Full membership",
          flex: "Flex membership",
          unavailable: "Unavailable plan",
        }}
      >
        <SelectTrigger id="plan" className="w-full">
          <SelectValue placeholder="Choose a plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Plans</SelectLabel>
            <SelectItem value="full">Full membership</SelectItem>
            <SelectItem value="flex">Flex membership</SelectItem>
            <SelectItem value="unavailable" disabled>
              Unavailable plan
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
export function Disabled(): ReactElement {
  return (
    <Select disabled>
      <SelectTrigger aria-label="Membership plan">
        <SelectValue placeholder="Choose a plan" />
      </SelectTrigger>
    </Select>
  );
}
