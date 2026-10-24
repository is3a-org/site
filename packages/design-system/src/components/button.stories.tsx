import { Plus } from "lucide-react";
import type { ReactElement } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";

const meta = {
  title: "Controls/Button",
  component: Button,
  args: { children: "Save changes" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "ghost", "destructive", "link"],
    },
    size: { control: "select", options: ["sm", "default", "lg", "icon", "icon-sm", "icon-lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;
export default meta;

export const Playground: StoryObj<typeof meta> = {};

export function Variants(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Save changes</Button>
      <Button variant="secondary">Manage membership</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="ghost">More options</Button>
      <Button variant="destructive">Remove member</Button>
      <Button variant="link">View details</Button>
    </div>
  );
}
export function Sizes(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Add member">
        <Plus />
      </Button>
    </div>
  );
}
export function Disabled(): ReactElement {
  return (
    <div className="flex gap-3">
      <Button disabled>Save changes</Button>
      <Button variant="outline" disabled>
        Cancel
      </Button>
    </div>
  );
}
export function AsLink(): ReactElement {
  return (
    <Button asChild>
      <a href="#membership">View membership</a>
    </Button>
  );
}
