import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Button } from "./button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./collapsible";

const meta = { title: "Data display/Collapsible" } satisfies Meta;
export default meta;

export function MembershipDetails(): ReactElement {
  return (
    <Collapsible className="max-w-md space-y-3">
      <CollapsibleTrigger asChild>
        <Button variant="outline">Membership details</Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-md border p-4 text-sm">
        Your membership gives you access to association activities and updates.
      </CollapsibleContent>
    </Collapsible>
  );
}
