import { afterEach, expect, test, vi } from "vite-plus/test";

// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./sheet";
import { Slider } from "./slider";
import { Switch } from "./switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

// DOM measurement APIs are absent in jsdom; these are browser-environment shims, not module mocks.
class TestResizeObserver {
  public observe(): void {}
  public unobserve(): void {}
  public disconnect(): void {}
}
vi.stubGlobal("ResizeObserver", TestResizeObserver);
Element.prototype.scrollIntoView = (): void => {};
afterEach(cleanup);

test("render composes a single link and disabled links cannot activate", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn<() => void>();
  render(
    <>
      <Button render={<a href="#members" aria-label="Members" />} nativeButton={false}>
        Members
      </Button>
      <Button
        render={<a href="#blocked" aria-label="Blocked" />}
        nativeButton={false}
        disabled
        onClick={onClick}
      >
        Blocked
      </Button>
    </>,
  );
  expect(screen.getByRole("link", { name: "Members" }).tagName).toBe("A");
  expect(screen.queryByRole("button")).toBeNull();
  await user.click(screen.getByRole("link", { name: "Blocked" }));
  expect(onClick).not.toHaveBeenCalled();
});

test("ordinary buttons do not submit forms and explicit submit buttons do", async () => {
  const user = userEvent.setup();
  const submit = vi.fn<() => void>();
  render(
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Button>Cancel</Button>
      <Button type="submit">Save</Button>
    </form>,
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(submit).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(submit).toHaveBeenCalledOnce();
});

test("dialog portals, focuses its input, dismisses with Escape, and restores focus", async () => {
  const user = userEvent.setup();
  render(
    <Dialog>
      <DialogTrigger render={<Button />}>Edit member</DialogTrigger>
      <DialogContent>
        <DialogTitle>Member details</DialogTitle>
        <DialogDescription>Update your contact details.</DialogDescription>
        <Input aria-label="Name" />
      </DialogContent>
    </Dialog>,
  );
  const trigger = screen.getByRole("button", { name: "Edit member" });
  await user.click(trigger);
  expect(screen.getByRole("dialog", { name: "Member details" })).toBeDefined();
  await waitFor(() => {
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Name" }));
  });
  await user.keyboard("{Escape}");
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  await waitFor(() => {
    expect(document.activeElement).toBe(trigger);
  });
});

test("sheet exposes its accessible title and close control", async () => {
  const user = userEvent.setup();
  render(
    <Sheet>
      <SheetTrigger render={<Button />}>Navigation</SheetTrigger>
      <SheetContent side="left">
        <SheetTitle>Association</SheetTitle>
        <SheetDescription>Choose a section.</SheetDescription>
      </SheetContent>
    </Sheet>,
  );
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  expect(screen.getByRole("dialog", { name: "Association" })).toBeDefined();
  await user.click(screen.getByRole("button", { name: "Close panel" }));
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

test("menu supports keyboard selection and closes after an action", async () => {
  const user = userEvent.setup();
  const select = vi.fn<() => void>();
  render(
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button />}>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={select}>Edit</DropdownMenuItem>
        <DropdownMenuItem disabled>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  screen.getByRole("button", { name: "Actions" }).focus();
  await user.keyboard("{ArrowDown}");
  expect(await screen.findByRole("menu")).toBeDefined();
  await user.keyboard("{Enter}");
  expect(select).toHaveBeenCalledOnce();
  await waitFor(() => {
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

test("select displays labels and changes its submitted value", async () => {
  const user = userEvent.setup();
  const change = vi.fn<(value: string | null) => void>();
  render(
    <Select
      defaultValue="full"
      onValueChange={change}
      name="plan"
      items={{ full: "Full membership", flex: "Flexible membership" }}
    >
      <SelectTrigger aria-label="Plan">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="full">Full membership</SelectItem>
        <SelectItem value="flex">Flexible membership</SelectItem>
      </SelectContent>
    </Select>,
  );
  const trigger = screen.getByRole("combobox", { name: "Plan" });
  expect(trigger.textContent).toContain("Full membership");
  await user.click(trigger);
  await user.click(await screen.findByRole("option", { name: "Flexible membership" }));
  expect(change.mock.calls[0]?.[0]).toBe("flex");
  expect(trigger.textContent).toContain("Flexible membership");
});

test("checkbox, switch, and radio expose checked state and native form values", async () => {
  const user = userEvent.setup();
  render(
    <form aria-label="Preferences">
      <Checkbox name="updates" value="yes" aria-label="Updates" />
      <Switch name="active" value="yes" aria-label="Active" />
      <RadioGroup name="location" defaultValue="delft" aria-label="Location">
        <RadioGroupItem value="delft" aria-label="Delft" />
        <RadioGroupItem value="leiden" aria-label="Leiden" />
      </RadioGroup>
    </form>,
  );
  const checkbox = screen.getByRole("checkbox", { name: "Updates" });
  await user.click(checkbox);
  expect(checkbox.getAttribute("aria-checked")).toBe("true");
  const toggle = screen.getByRole("switch", { name: "Active" });
  await user.click(toggle);
  expect(toggle.getAttribute("aria-checked")).toBe("true");
  await user.click(screen.getByRole("radio", { name: "Leiden" }));
  const form = screen.getByRole("form", { name: "Preferences" });
  if (!(form instanceof HTMLFormElement)) {
    throw new TypeError("Expected form");
  }
  const data = new FormData(form);
  expect(data.get("updates")).toBe("yes");
  expect(data.get("active")).toBe("yes");
  expect(data.get("location")).toBe("leiden");
});

test("slider has an accessible name and responds to arrow keys", async () => {
  const user = userEvent.setup();
  const change = vi.fn<(value: readonly number[]) => void>();
  render(
    <Slider aria-label="Participants" defaultValue={[3]} min={0} max={10} onValueChange={change} />,
  );
  const thumb = screen.getByRole("slider", { name: "Participants" });
  thumb.focus();
  await user.keyboard("{ArrowRight}");
  expect(change.mock.calls[0]?.[0]).toEqual([4]);
});

test("tabs and collapsibles expose expanded and selected states", async () => {
  const user = userEvent.setup();
  render(
    <>
      <Tabs defaultValue="details">
        <TabsList aria-label="Member">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="details">Contact information</TabsContent>
        <TabsContent value="billing">Invoices</TabsContent>
      </Tabs>
      <Collapsible>
        <CollapsibleTrigger render={<Button />}>More</CollapsibleTrigger>
        <CollapsibleContent>Additional information</CollapsibleContent>
      </Collapsible>
    </>,
  );
  await user.click(screen.getByRole("tab", { name: "Billing" }));
  expect(screen.getByRole("tabpanel").textContent).toBe("Invoices");
  const trigger = screen.getByRole("button", { name: "More" });
  await user.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText("Additional information")).toBeDefined();
});
