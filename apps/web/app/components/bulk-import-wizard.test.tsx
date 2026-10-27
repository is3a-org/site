import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vite-plus/test";

// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { readFormText } from "~/fragno/request-form";
import type { BulkImportJob, BulkImportResponse, ImportCustomer } from "~/lib/bulk-import";

interface TestActionArgs {
  readonly request: Request;
}

import { BulkImportWizard } from "./bulk-import-wizard";

const customers: readonly ImportCustomer[] = [
  { id: "cus_existing", email: "stripe@example.com", name: "Existing member", created: 1 },
  { id: "cus_new", email: "new@example.com", name: "New member", created: 2 },
];
const existingUsers = [
  { id: "member", email: "login@example.com", stripeCustomerId: "cus_existing" },
];
const syncStates = [{ customerId: "cus_existing", status: "synced" }] satisfies Parameters<
  typeof BulkImportWizard
>[0]["syncStates"];
const initialJob: BulkImportJob = {
  id: "a07fa000-0000-4000-8000-000000000001",
  ownerId: "admin",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  items: [{ customerId: "cus_new", status: "queued", accountCreated: false, linked: false }],
};

afterEach(cleanup);

it("marks existing accounts by Stripe ID and selects only customers without accounts", async () => {
  const router = createMemoryRouter([
    {
      path: "/",
      element: (
        <BulkImportWizard
          stripeCustomers={customers}
          existingUsers={existingUsers}
          syncStates={syncStates}
        />
      ),
    },
  ]);
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  expect(screen.getByText("Existing account: login@example.com")).toBeDefined();
  expect(
    screen
      .getByRole("checkbox", { name: "Select Stripe customer cus_existing" })
      .getAttribute("aria-disabled"),
  ).toBe("true");
  await user.click(screen.getByRole("button", { name: "Select customers without accounts" }));
  expect(
    screen
      .getByRole("checkbox", { name: "Select Stripe customer cus_new" })
      .getAttribute("aria-checked"),
  ).toBe("true");
  await user.click(screen.getByRole("button", { name: "Preview" }));
  expect(screen.getByText(/1 accounts to create/)).toBeDefined();
  expect(screen.getByRole("button", { name: "Start import (1)" })).toBeDefined();
  router.dispose();
});

it("submits a saved selection and then advances small requests automatically", async () => {
  const intents: string[] = [];
  const forms: FormData[] = [];
  const action = async ({ request }: TestActionArgs): Promise<BulkImportResponse> => {
    const form = await request.formData();
    const intent = readFormText(form, "intent") ?? "";
    forms.push(form);
    intents.push(intent);
    if (intent === "start") {
      return { success: true, job: initialJob };
    }
    return {
      success: true,
      job: {
        ...initialJob,
        updatedAt: "2026-01-02",
        items: initialJob.items.map((item) => ({
          ...item,
          userId: "new-member",
          accountCreated: true,
          linked: true,
          status: "synced",
        })),
      },
    };
  };
  const router = createMemoryRouter([
    {
      path: "/",
      action,
      element: (
        <BulkImportWizard
          stripeCustomers={customers}
          existingUsers={existingUsers}
          syncStates={syncStates}
        />
      ),
    },
  ]);
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Select customers without accounts" }));
  await user.click(screen.getByRole("button", { name: "Preview" }));
  await user.click(screen.getByRole("button", { name: "Start import (1)" }));
  expect(await screen.findByText("Import complete")).toBeDefined();
  expect(intents).toEqual(["start", "process"]);
  expect(forms[0].get("customerIds")).toBe('["cus_new"]');
  expect(forms[1].get("importId")).toBe(initialJob.id);
  expect(screen.getByRole("link", { name: "Saved import link" }).getAttribute("href")).toContain(
    initialJob.id,
  );
  router.dispose();
});

it("resumes an existing import without resubmitting its selection or claiming pending sync is complete", async () => {
  const pending: BulkImportJob = {
    ...initialJob,
    items: [
      {
        ...initialJob.items[0],
        userId: "new-member",
        linked: true,
        accountCreated: true,
        status: "sync_pending",
      },
    ],
  };
  const intents: string[] = [];
  const router = createMemoryRouter([
    {
      path: "/",
      action: async ({ request }: TestActionArgs): Promise<BulkImportResponse> => {
        const form = await request.formData();
        intents.push(readFormText(form, "intent") ?? "");
        return {
          success: true,
          job: { ...pending, items: pending.items.map((item) => ({ ...item, status: "synced" })) },
        };
      },
      element: (
        <BulkImportWizard
          stripeCustomers={customers}
          existingUsers={existingUsers}
          syncStates={syncStates}
          initialJob={pending}
        />
      ),
    },
  ]);
  render(<RouterProvider router={router} />);
  expect(screen.queryByText("Import complete")).toBeNull();
  expect(screen.getByText("Linked · sync pending")).toBeDefined();
  expect(screen.getByRole("button", { name: "Resume import" })).toBeDefined();
  await userEvent.setup().click(screen.getByRole("button", { name: "Refresh status" }));
  await waitFor(() => {
    expect(screen.getByText("Import complete")).toBeDefined();
  });
  expect(intents).toEqual(["status"]);
  router.dispose();
});

it("retries saved errors without replaying a start action", async () => {
  const failed: BulkImportJob = {
    ...initialJob,
    items: [
      {
        ...initialJob.items[0],
        accountCreated: true,
        userId: "new-member",
        status: "error",
        error: "Temporary failure",
      },
    ],
  };
  const intents: string[] = [];
  const router = createMemoryRouter([
    {
      path: "/",
      action: async ({ request }: TestActionArgs): Promise<BulkImportResponse> => {
        const form = await request.formData();
        intents.push(readFormText(form, "intent") ?? "");
        return {
          success: true,
          job: {
            ...failed,
            items: failed.items.map((item) => ({
              ...item,
              status: "synced",
              linked: true,
              error: undefined,
            })),
          },
        };
      },
      element: (
        <BulkImportWizard
          stripeCustomers={customers}
          existingUsers={existingUsers}
          syncStates={syncStates}
          initialJob={failed}
        />
      ),
    },
  ]);
  render(<RouterProvider router={router} />);
  expect(screen.getByText("Temporary failure")).toBeDefined();
  await userEvent.setup().click(screen.getByRole("button", { name: "Retry remaining" }));
  expect(await screen.findByText("Import complete")).toBeDefined();
  expect(intents).toEqual(["retry"]);
  router.dispose();
});

it("does not offer a retry that a conflict would block", () => {
  const blocked: BulkImportJob = {
    ...initialJob,
    items: [
      { ...initialJob.items[0], status: "error", error: "Temporary failure" },
      {
        customerId: "cus_existing",
        status: "conflict",
        accountCreated: false,
        linked: false,
        error: "Account already linked",
      },
    ],
  };
  const router = createMemoryRouter([
    {
      path: "/",
      element: (
        <BulkImportWizard
          stripeCustomers={customers}
          existingUsers={existingUsers}
          syncStates={syncStates}
          initialJob={blocked}
        />
      ),
    },
  ]);
  render(<RouterProvider router={router} />);
  expect(screen.queryByRole("button", { name: "Retry remaining" })).toBeNull();
  expect(screen.getByText(/start a new import to continue/)).toBeDefined();
  router.dispose();
});
