import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Separator } from "./separator";

const meta = { title: "Data display/Separator" } satisfies Meta;
export default meta;

export function Horizontal(): ReactElement {
  return (
    <div className="max-w-sm space-y-4">
      <p className="text-sm font-medium">Membership</p>
      <Separator />
      <p className="text-sm text-muted-foreground">Account settings</p>
    </div>
  );
}
export function Vertical(): ReactElement {
  return (
    <div className="flex h-6 items-center gap-4 text-sm">
      <span>Members</span>
      <Separator orientation="vertical" />
      <span>Forms</span>
      <Separator orientation="vertical" />
      <span>Locations</span>
    </div>
  );
}
