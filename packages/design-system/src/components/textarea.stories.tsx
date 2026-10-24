import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Label } from "./label";
import { Textarea } from "./textarea";

const meta = { title: "Forms/Textarea" } satisfies Meta;
export default meta;

export function Default(): ReactElement {
  return (
    <div className="grid max-w-md gap-2">
      <Label htmlFor="notes">Additional information</Label>
      <Textarea id="notes" placeholder="Tell us what you need." rows={4} />
    </div>
  );
}
export function Disabled(): ReactElement {
  return (
    <div className="grid max-w-md gap-2">
      <Label htmlFor="disabled-notes">Additional information</Label>
      <Textarea id="disabled-notes" defaultValue="Your application is being reviewed." disabled />
    </div>
  );
}
