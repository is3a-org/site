import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Badge } from "./badge";

const meta = { title: "Data display/Badge" } satisfies Meta;
export default meta;

export function Variants(): ReactElement {
  return (
    <div className="flex flex-wrap gap-3">
      <Badge>Admin</Badge>
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="secondary">Closed</Badge>
      <Badge variant="outline">Flex membership</Badge>
      <Badge variant="destructive">Payment failed</Badge>
    </div>
  );
}
