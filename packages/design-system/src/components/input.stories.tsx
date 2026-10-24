import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Input } from "./input";
import { Label } from "./label";

const meta = { title: "Forms/Input" } satisfies Meta;
export default meta;

export function Default(): ReactElement {
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="member@example.com" autoComplete="email" />
    </div>
  );
}
export function Invalid(): ReactElement {
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="invalid-email">Email address</Label>
      <Input
        id="invalid-email"
        defaultValue="not-an-email"
        aria-invalid
        aria-describedby="email-error"
      />
      <p id="email-error" className="text-sm text-destructive">
        Enter a valid email address.
      </p>
    </div>
  );
}
export function Disabled(): ReactElement {
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="disabled-email">Email address</Label>
      <Input id="disabled-email" disabled defaultValue="member@example.com" />
    </div>
  );
}
