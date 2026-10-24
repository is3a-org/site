import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Label } from "./label";
import { Switch } from "./switch";

const meta = { title: "Controls/Switch" } satisfies Meta;
export default meta;

export function Default(): ReactElement {
  return (
    <div className="flex items-center gap-3">
      <Switch id="notifications" defaultChecked />
      <Label htmlFor="notifications">Email notifications</Label>
    </div>
  );
}
export function Disabled(): ReactElement {
  return (
    <div className="flex items-center gap-3">
      <Switch id="disabled-notifications" disabled />
      <Label htmlFor="disabled-notifications">Email notifications</Label>
    </div>
  );
}
