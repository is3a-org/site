import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Button } from "./button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "./sheet";

const meta = { title: "Overlays/Sheet" } satisfies Meta;
export default meta;

export function MemberDetails(): ReactElement {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>View member</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Alex de Vries</SheetTitle>
          <SheetDescription>Full membership · Active</SheetDescription>
        </SheetHeader>
        <div className="px-4 text-sm">
          <p>alex@example.com</p>
        </div>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
export function Left(): ReactElement {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Open navigation</SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>IS3A</SheetTitle>
          <SheetDescription>Manage your membership and account.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
