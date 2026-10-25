import type { ReactElement } from "react";
import { useState } from "react";

import type { Meta } from "@storybook/react-vite";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "./dropdown-menu";

const meta = { title: "Overlays/Dropdown menu" } satisfies Meta;
export default meta;

export function MemberActions(): ReactElement {
  const [updates, setUpdates] = useState(true);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Member actions
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Alex de Vries</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>View profile</DropdownMenuItem>
        <DropdownMenuItem>Edit membership</DropdownMenuItem>
        <DropdownMenuCheckboxItem checked={updates} onCheckedChange={setUpdates}>
          Receive updates
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Remove member</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
