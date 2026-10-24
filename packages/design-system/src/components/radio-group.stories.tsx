import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta = { title: "Controls/Radio group" } satisfies Meta;
export default meta;

export function Membership(): ReactElement {
  return (
    <RadioGroup defaultValue="full" aria-label="Membership plan">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="full" id="full" />
        <Label htmlFor="full">Full membership</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="flex" id="flex" />
        <Label htmlFor="flex">Flex membership</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="unavailable" id="unavailable" disabled />
        <Label htmlFor="unavailable">Not available</Label>
      </div>
    </RadioGroup>
  );
}
