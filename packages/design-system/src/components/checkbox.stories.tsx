import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = { title: "Controls/Checkbox" } satisfies Meta;
export default meta;

export function Default(): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">I agree to the membership terms</Label>
    </div>
  );
}
export function Checked(): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="newsletter" defaultChecked />
      <Label htmlFor="newsletter">Receive association updates</Label>
    </div>
  );
}
export function Indeterminate(): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="select-all" indeterminate />
      <Label htmlFor="select-all">Select all members</Label>
    </div>
  );
}
export function Disabled(): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="locked" disabled defaultChecked />
      <Label htmlFor="locked">Membership confirmed</Label>
    </div>
  );
}
