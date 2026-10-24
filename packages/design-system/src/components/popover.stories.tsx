import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";

const meta = { title: "Overlays/Popover" } satisfies Meta;
export default meta;

export function Filters(): ReactElement {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Filter members</Button>
      </PopoverTrigger>
      <PopoverContent className="grid gap-3">
        <h2 className="text-sm font-semibold">Search members</h2>
        <Label htmlFor="member-filter">Name or email</Label>
        <Input id="member-filter" placeholder="Search members…" />
      </PopoverContent>
    </Popover>
  );
}
