import { useState, type JSX } from "react";
import { afterEach, expect, test, vi } from "vite-plus/test";

import {
  RuleEffect,
  type ControlProps,
  type JsonSchema,
  type UISchemaElement,
} from "@jsonforms/core";
import { JsonForms } from "@jsonforms/react";
// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { formRenderDataSchema, type FormRenderData } from "../../lib/form-render-data";
import { FormControl, formRenderers } from "./renderers";

class TestResizeObserver {
  public observe(): void {}
  public unobserve(): void {}
  public disconnect(): void {}
}
vi.stubGlobal("ResizeObserver", TestResizeObserver);
Element.prototype.scrollIntoView = (): void => {};

const onChange =
  vi.fn<(path: string, value: string | number | boolean | null | undefined) => void>();
const control: ControlProps = {
  id: "member-field",
  path: "name",
  data: "",
  label: "Name",
  description: "Use your full name.",
  errors: "",
  enabled: true,
  visible: true,
  schema: { type: "string" },
  rootSchema: { type: "object" },
  uischema: { type: "Control", scope: "#/properties/name" },
  handleChange: onChange,
};
afterEach(() => {
  cleanup();
  onChange.mockClear();
});

test("text fields preserve validation, descriptions, visibility, and disabled state", () => {
  const view = render(<FormControl {...control} errors="Name is required" required />);
  const input = screen.getByRole("textbox", { name: "Name" });
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(input.getAttribute("aria-describedby")).toContain("member-field-error");
  expect(screen.getByRole("alert").textContent).toBe("Name is required");
  view.rerender(<FormControl {...control} enabled={false} />);
  expect(screen.getByRole("textbox").hasAttribute("disabled")).toBe(true);
  view.rerender(<FormControl {...control} visible={false} />);
  expect(screen.queryByRole("textbox")).toBeNull();
});

test("numeric input emits numbers and clearing emits undefined", async () => {
  const user = userEvent.setup();
  render(
    <FormControl {...control} data={12} schema={{ type: "integer", minimum: 0, maximum: 20 }} />,
  );
  await user.clear(screen.getByRole("spinbutton"));
  expect(onChange.mock.calls.at(-1)).toEqual(["name", undefined]);
});

test("enum labels preserve empty-string, numeric, and boolean values", async () => {
  const user = userEvent.setup();
  const view = render(
    <FormControl
      {...control}
      data={false}
      schema={{
        oneOf: [
          { const: false, title: "No" },
          { const: "", title: "Empty" },
          { const: 2, title: "Two" },
        ],
      }}
    />,
  );
  expect(screen.getByRole("combobox").textContent).toContain("No");
  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: "Empty" }));
  expect(onChange).toHaveBeenLastCalledWith("name", "");
  view.rerender(
    <FormControl
      {...control}
      data=""
      schema={{
        oneOf: [
          { const: "", title: "Empty" },
          { const: 2, title: "Two" },
        ],
      }}
    />,
  );
  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: "Two" }));
  expect(onChange).toHaveBeenLastCalledWith("name", 2);
});

test("boolean controls and radio enums use Base UI state", async () => {
  const user = userEvent.setup();
  const view = render(<FormControl {...control} data={false} schema={{ type: "boolean" }} />);
  await user.click(screen.getByRole("checkbox"));
  expect(onChange).toHaveBeenLastCalledWith("name", true);
  view.rerender(
    <FormControl
      {...control}
      schema={{ type: "boolean" }}
      uischema={{ ...control.uischema, options: { toggle: true } }}
    />,
  );
  expect(screen.getByRole("switch")).toBeDefined();
  view.rerender(
    <FormControl
      {...control}
      data="full"
      schema={{ type: "string", enum: ["full", "flex"] }}
      uischema={{ ...control.uischema, options: { format: "radio" } }}
    />,
  );
  await user.click(screen.getByRole("radio", { name: "flex" }));
  expect(onChange).toHaveBeenLastCalledWith("name", "flex");
});

const schema: JsonSchema = {
  type: "object",
  properties: {
    name: { type: "string", title: "Name" },
    notes: { type: "string", title: "Notes" },
    count: { type: "number", minimum: 0, maximum: 10, title: "Participants" },
    email: { type: "string", format: "email", title: "Email" },
    date: { type: "string", format: "date", title: "Date" },
    time: { type: "string", format: "time", title: "Time" },
    datetime: { type: "string", format: "date-time", title: "Date and time" },
    address: {
      type: "object",
      title: "Address",
      properties: { city: { type: "string", title: "City" } },
    },
    show: { type: "boolean", title: "Show details" },
  },
};
const layout = {
  type: "VerticalLayout",
  elements: [
    { type: "Label", text: "Member registration" },
    { type: "Control", scope: "#/properties/name" },
    { type: "Control", scope: "#/properties/notes", options: { multi: true } },
    { type: "Control", scope: "#/properties/count", options: { slider: true } },
    ...["email", "date", "time", "datetime", "address", "show"].map((name) => ({
      type: "Control",
      scope: `#/properties/${name}`,
    })),
  ],
};
// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- COMPATIBILITY: JSON Forms owns the mutable UI schema graph supplied to its renderer context.
function FormHarness({ uischema = layout }: { readonly uischema?: UISchemaElement }): JSX.Element {
  const [data, setData] = useState<FormRenderData>({ name: "Alex", count: 3, show: false });
  return (
    <>
      <JsonForms
        schema={schema}
        uischema={uischema}
        data={data}
        renderers={formRenderers}
        onChange={(state) => {
          setData(formRenderDataSchema.parse(state.data));
        }}
      />
      <output aria-label="Form data">{JSON.stringify(data)}</output>
    </>
  );
}

test("JSON Forms dispatches all builder field types and nested objects through the local registry", async () => {
  const user = userEvent.setup();
  render(<FormHarness />);
  expect(screen.queryByText(/No applicable renderer/u)).toBeNull();
  expect(screen.getByText("Member registration")).toBeDefined();
  expect(screen.getByRole("textbox", { name: "Notes" }).tagName).toBe("TEXTAREA");
  expect(screen.getByRole("slider", { name: "Participants" })).toBeDefined();
  expect(screen.getByLabelText("Email").getAttribute("type")).toBe("email");
  expect(screen.getByLabelText("Date").getAttribute("type")).toBe("date");
  expect(screen.getByLabelText("Time").getAttribute("type")).toBe("time");
  expect(screen.getByLabelText("Date and time").getAttribute("type")).toBe("datetime-local");
  await user.type(screen.getByRole("textbox", { name: "City" }), "Delft");
  await waitFor(() => {
    expect(screen.getByLabelText("Form data").textContent).toContain('"address":{"city":"Delft"}');
  });
});

test("JSON Forms rules hide and reveal controls without replacing the form engine", async () => {
  const user = userEvent.setup();
  const ruled = {
    type: "VerticalLayout",
    elements: [
      { type: "Control", scope: "#/properties/show" },
      {
        type: "Control",
        scope: "#/properties/name",
        rule: {
          effect: RuleEffect.SHOW,
          condition: { scope: "#/properties/show", schema: { const: true } },
        },
      },
    ],
  };
  render(<FormHarness uischema={ruled} />);
  expect(screen.queryByRole("textbox", { name: "Name" })).toBeNull();
  await user.click(screen.getByRole("checkbox", { name: "Show details" }));
  expect(await screen.findByRole("textbox", { name: "Name" })).toBeDefined();
});

test("categorization keeps tabs and stepper navigation", async () => {
  const user = userEvent.setup();
  const categories = {
    type: "Categorization",
    options: { variant: "stepper" },
    elements: [
      {
        type: "Category",
        label: "Contact",
        elements: [{ type: "Control", scope: "#/properties/name" }],
      },
      {
        type: "Category",
        label: "Location",
        elements: [{ type: "Control", scope: "#/properties/address" }],
      },
    ],
  };
  render(<FormHarness uischema={categories} />);
  expect(screen.getByRole("tab", { name: "Contact" }).getAttribute("aria-selected")).toBe("true");
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("tab", { name: "Location" }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("textbox", { name: "City" })).toBeDefined();
});
