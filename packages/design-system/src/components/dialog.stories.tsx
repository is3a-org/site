import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Button } from "./button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";

const meta = { title: "Overlays/Dialog" } satisfies Meta;
export default meta;

export function Confirmation(): ReactElement {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Review membership</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm membership change</DialogTitle>
          <DialogDescription>
            You are switching from full to flex membership. Review the change before continuing.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button />}>Confirm change</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
