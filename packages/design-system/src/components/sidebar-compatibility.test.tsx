import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { SidebarMenuButton, SidebarProvider, useSidebar } from "./sidebar";

type SidebarPublicContext = Readonly<ReturnType<typeof useSidebar>>;

function ObserveSidebar({
  onContext,
}: Readonly<{ onContext: (context: SidebarPublicContext) => void }>): undefined {
  onContext(useSidebar());
  return undefined;
}

function renderSidebarContext(
  open: boolean,
  onOpenChange: (open: boolean) => void,
): SidebarPublicContext {
  const onContext = vi.fn<(context: SidebarPublicContext) => void>();
  renderToStaticMarkup(
    <SidebarProvider open={open} onOpenChange={onOpenChange}>
      <ObserveSidebar onContext={onContext} />
    </SidebarProvider>,
  );
  const context = onContext.mock.calls.at(0)?.[0];
  if (context === undefined) {
    throw new Error("Sidebar compatibility test could not observe the public context");
  }
  return context;
}

const cookieJar = { cookie: "" };

beforeEach(() => {
  cookieJar.cookie = "";
  vi.stubGlobal("document", cookieJar);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("sidebar boolean setters notify the controlled parent and persist the existing cookie", () => {
  const onOpenChange = vi.fn<(open: boolean) => void>();
  const sidebar = renderSidebarContext(true, onOpenChange);

  sidebar.setOpen(false);

  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  expect(cookieJar.cookie).toBe("sidebar_state=false; path=/; max-age=604800");
});

test("sidebar toggles resolve updater callbacks against the current controlled value", () => {
  const onOpenChange = vi.fn<(open: boolean) => void>();
  const sidebar = renderSidebarContext(false, onOpenChange);

  sidebar.toggleSidebar();

  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  expect(cookieJar.cookie).toBe("sidebar_state=true; path=/; max-age=604800");
});

test("sidebar tooltip text preserves the menu button while its real portal is closed", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider defaultOpen={false}>
      <SidebarMenuButton tooltip="Member details" aria-label="Members menu">
        Members
      </SidebarMenuButton>
    </SidebarProvider>,
  );

  expect(markup).toContain('data-slot="sidebar-menu-button"');
  expect(markup).toContain('aria-label="Members menu"');
  expect(markup).toContain('data-state="closed"');
  expect(markup).not.toContain('data-slot="tooltip-content"');
  expect(markup).not.toContain("Member details");
  expect(markup).toContain(">Members</button>");
});

test("sidebar accepts tooltip content props without leaking them onto the menu button", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider defaultOpen={false}>
      <SidebarMenuButton
        tooltip={{
          children: <strong>Custom details</strong>,
          className: "custom-tooltip",
          "aria-label": "Customer information",
          hidden: true,
        }}
        aria-label="Customers menu"
      >
        Customers
      </SidebarMenuButton>
    </SidebarProvider>,
  );

  expect(markup).toContain('data-slot="sidebar-menu-button"');
  expect(markup).toContain('aria-label="Customers menu"');
  expect(markup).toContain('data-state="closed"');
  expect(markup).toContain(">Customers</button>");
  expect(markup).not.toContain("custom-tooltip");
  expect(markup).not.toContain("Customer information");
  expect(markup).not.toContain("Custom details");
});

test("an empty sidebar tooltip keeps the existing button-only output", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <SidebarMenuButton tooltip="">Members</SidebarMenuButton>
    </SidebarProvider>,
  );

  expect(markup).toContain('data-slot="sidebar-menu-button"');
  expect(markup).not.toContain('data-state="closed"');
});
