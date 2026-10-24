import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Input } from "./input";
import { Label } from "./label";

const meta = { title: "Forms/Label" } satisfies Meta;
export default meta;

export function AssociatedInput(): ReactElement {
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="name">Full name</Label>
      <Input id="name" placeholder="Your name" autoComplete="name" />
    </div>
  );
}
