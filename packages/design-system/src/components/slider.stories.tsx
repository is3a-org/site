import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Slider } from "./slider";

const meta = { title: "Controls/Slider" } satisfies Meta;
export default meta;

export function Default(): ReactElement {
  return (
    <div className="max-w-sm p-4">
      <Slider aria-label="Number of participants" defaultValue={[30]} max={100} step={1} />
    </div>
  );
}
export function Disabled(): ReactElement {
  return (
    <div className="max-w-sm p-4">
      <Slider aria-label="Number of participants" defaultValue={[30]} disabled />
    </div>
  );
}
