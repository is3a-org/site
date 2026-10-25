import { useRender } from "@base-ui/react/use-render";
import { PanelLeftIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../cn";
import { focus } from "../control-styles";
import { useIsMobile } from "../hooks/use-mobile";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./sheet";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3.5rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

interface SidebarCSSProperties extends React.CSSProperties {
  "--sidebar-width"?: string;
  "--sidebar-width-icon"?: string;
  "--skeleton-width"?: string;
}

interface SidebarContextProps {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined);

function useSidebar(): SidebarContextProps {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}): React.JSX.Element {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      // oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: React state setters accept a boolean or an updater callback; resolve both before notifying the controlled parent.
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // This sets the cookie to keep the sidebar state.
      // oxlint-disable-next-line unicorn/no-document-cookie -- COMPATIBILITY: Sidebar updates synchronously persist the existing boolean cookie with Path=/ and a seven-day Max-Age, including browsers without CookieStore.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((open) => !open);
    } else {
      setOpen((open) => !open);
    }
  }, [isMobile, setOpen, setOpenMobile]);

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return (): void => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );
  const sidebarStyle: SidebarCSSProperties = {
    "--sidebar-width": SIDEBAR_WIDTH,
    "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
    ...style,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delay={0}>
        <div
          data-slot="sidebar-wrapper"
          style={sidebarStyle}
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}): React.JSX.Element {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (isMobile && collapsible !== "none") {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side={side}
          className={cn("w-72 bg-sidebar p-0 text-sidebar-foreground", className)}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Association and account navigation</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col pt-12" {...props}>
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <div
      data-slot="sidebar"
      data-state={state}
      data-side={side}
      data-variant={variant}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      className={cn("group peer shrink-0", collapsible !== "none" && "hidden md:block")}
    >
      <div
        className={cn(
          "w-(--sidebar-width) transition-[width] duration-200 motion-reduce:transition-none",
          collapsible !== "none" &&
            "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[collapsible=offcanvas]:w-0",
        )}
      />
      <div
        className={cn(
          "fixed inset-y-0 z-20 flex w-(--sidebar-width) flex-col border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 motion-reduce:transition-none",
          side === "left"
            ? "left-0 border-r group-data-[collapsible=offcanvas]:-translate-x-full"
            : "right-0 border-l group-data-[collapsible=offcanvas]:translate-x-full",
          "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          variant === "floating" && "inset-y-2 mx-2 rounded-lg border shadow-md",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}
function SidebarTrigger({
  onClick,
  ...props
}: React.ComponentProps<typeof Button>): React.JSX.Element {
  const { toggleSidebar, open, isMobile, openMobile } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle navigation"
      aria-expanded={isMobile ? openMobile : open}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          toggleSidebar();
        }
      }}
      {...props}
    >
      <PanelLeftIcon />
    </Button>
  );
}
function SidebarRail({ className, ...props }: React.ComponentProps<"button">): React.JSX.Element {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      aria-label="Toggle navigation"
      onClick={toggleSidebar}
      className={cn(
        "absolute inset-y-0 right-0 w-2 cursor-col-resize hover:bg-sidebar-accent",
        focus,
        className,
      )}
      {...props}
    />
  );
}
function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>): React.JSX.Element {
  return <Input className={cn("bg-background", className)} {...props} />;
}
function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>): React.JSX.Element {
  return <Separator className={cn("bg-sidebar-border", className)} {...props} />;
}
function SidebarMenuButton({
  isActive = false,
  size = "default",
  variant = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
}): React.JSX.Element {
  const { isMobile, state } = useSidebar();
  let accessibleLabel: string | undefined;
  let content: React.ComponentProps<typeof TooltipContent> | undefined;
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: The tooltip accepts text or popup props; text also names icon-only navigation buttons.
  if (typeof tooltip === "string") {
    accessibleLabel = tooltip;
    content = { children: tooltip };
  } else {
    content = tooltip;
  }
  const button = (
    <Button
      variant="ghost"
      size={size}
      aria-label={accessibleLabel}
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-active={isActive}
      className={cn(
        "w-full justify-start overflow-hidden text-left font-medium text-sidebar-foreground group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:px-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary [&>span]:truncate group-data-[collapsible=icon]:[&>span]:hidden",
        variant === "outline" && "border border-sidebar-border",
        className,
      )}
      {...props}
    />
  );
  if (tooltip === undefined || tooltip === "") {
    return button;
  }
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="right" hidden={state !== "collapsed" || isMobile} {...content} />
    </Tooltip>
  );
}
function SidebarMenuSubButton({
  render,
  ref,
  className,
  size = "md",
  isActive = false,
  ...props
}: useRender.ComponentProps<"a"> & { size?: "sm" | "md"; isActive?: boolean }): React.JSX.Element {
  return useRender({
    defaultTagName: "a",
    render,
    ref,
    props: {
      ...props,
      "data-active": isActive,
      className: cn(
        "flex min-h-10 items-center gap-2 rounded-md px-3 text-sidebar-foreground hover:bg-sidebar-accent data-[active=true]:text-sidebar-primary",
        size === "sm" ? "text-xs" : "text-sm",
        focus,
        className,
      ),
    },
  });
}
function SidebarMenuAction({
  className,
  showOnHover = false,
  ...props
}: React.ComponentProps<typeof Button> & { showOnHover?: boolean }): React.JSX.Element {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "absolute top-0 right-0 group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "md:opacity-0 md:group-hover/menu-item:opacity-100 md:focus-visible:opacity-100",
        className,
      )}
      {...props}
    />
  );
}
function SidebarGroupAction(props: React.ComponentProps<typeof Button>): React.JSX.Element {
  return <SidebarMenuAction {...props} />;
}
function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & { showIcon?: boolean }): React.JSX.Element {
  return (
    <div className={cn("flex h-10 items-center gap-3 px-3", className)} {...props}>
      {showIcon && <Skeleton className="size-4" />}
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">): React.JSX.Element {
  return <main className={cn("min-w-0 flex-1 bg-background", className)} {...props} />;
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
  return <div className={cn("flex flex-col gap-2 p-2", className)} {...props} />;
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 border-t border-sidebar-border p-2", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
  return <div className={cn("relative flex flex-col gap-2 p-2", className)} {...props} />;
}

function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      className={cn(
        "px-3 py-2 text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">): React.JSX.Element {
  return <div className={cn("text-sm", className)} {...props} />;
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">): React.JSX.Element {
  return <ul className={cn("flex flex-col gap-1", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">): React.JSX.Element {
  return <li className={cn("group/menu-item relative", className)} {...props} />;
}

function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-3 right-3 text-xs tabular-nums group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">): React.JSX.Element {
  return (
    <ul
      className={cn(
        "ml-5 flex flex-col gap-1 border-l border-sidebar-border pl-2 group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">): React.JSX.Element {
  return <li className={cn("relative", className)} {...props} />;
}

export {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
  SidebarInput,
  SidebarSeparator,
  SidebarMenuButton,
  SidebarMenuSubButton,
  SidebarMenuAction,
  SidebarGroupAction,
  SidebarMenuSkeleton,
  useSidebar,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
};
