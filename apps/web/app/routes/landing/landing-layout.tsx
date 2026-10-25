import { buttonVariants } from "@is3a/design-system/button";
import { ArrowUpRight, Menu, X } from "lucide-react";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router";

import { IS3ALogo } from "~/components/icons/is3a";
import { landingContainer, textLink } from "~/components/landing/landing-styles";
import { ThemeSwitch } from "~/components/theme-switch";
import { cn } from "~/lib/utils";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/team", label: "Team" },
  { to: "/former-speakers", label: "Speakers" },
  { to: "/login", label: "Log in" },
];

// The current page carries the IS3A bracket, as in the dashboard sidebar.
const navLinkClass =
  "relative flex min-h-10 items-center px-3 font-display text-[0.9375rem] font-semibold text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bracket aria-[current=page]:text-foreground";

const calendarUrl =
  "https://calendar.google.com/calendar/ical/c_ehjqad1bljvvebaed6gv2tb8vo%40group.calendar.google.com/public/basic.ics";

function ExternalLink({
  href,
  children,
}: Readonly<{ href: string; children: string }>): JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(textLink, "inline-flex items-center gap-1")}
    >
      {children}
      <ArrowUpRight aria-hidden className="size-3.5" />
    </a>
  );
}

export default function LandingLayout(): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => {
      setScrolled(window.scrollY > 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return (): void => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header
        className={cn(
          "sticky top-0 z-20 border-b bg-background/90 backdrop-blur-md transition-colors",
          scrolled || mobileMenuOpen ? "border-border" : "border-transparent",
        )}
      >
        <nav aria-label="Main" className={cn(landingContainer, "flex h-16 items-center gap-2")}>
          <button
            type="button"
            className="-ml-2 grid size-10 place-items-center rounded-md text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <Link to="/" aria-label="IS3A home" className="mr-4 shrink-0">
            <IS3ALogo className="h-8 w-auto" />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} end className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </div>

          <ThemeSwitch className="ml-auto" />
          <Link to="/join" className={buttonVariants({ className: "hidden sm:inline-flex" })}>
            Become a member
          </Link>
        </nav>

        <div
          id="landing-mobile-menu"
          inert={!mobileMenuOpen}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none md:hidden",
            mobileMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className={cn(landingContainer, "flex flex-col items-start gap-1 pt-1 pb-4")}>
              {[...navLinks, { to: "/join", label: "Become a member" }].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  className={navLinkClass}
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t-2 border-ink">
        <div className={cn(landingContainer, "grid gap-10 py-12 text-sm md:grid-cols-12")}>
          <div className="space-y-3 md:col-span-6">
            <IS3ALogo className="h-10 w-auto" />
            <p className="max-w-xs text-muted-foreground">
              Information Sciences Association for Amsterdam Alumni
            </p>
          </div>
          <div className="space-y-3 md:col-span-3">
            <h2 className="text-base font-semibold font-display">Follow</h2>
            <ul className="space-y-2">
              <li>
                <ExternalLink href="https://instagram.com/is3a.nl">Instagram</ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://www.linkedin.com/company/is3a/">LinkedIn</ExternalLink>
              </li>
              <li>
                <ExternalLink href={calendarUrl}>Events calendar (iCal)</ExternalLink>
              </li>
            </ul>
          </div>
          <div className="space-y-3 md:col-span-3">
            <h2 className="text-base font-semibold font-display">Contact</h2>
            <ul className="space-y-2">
              <li>
                <a href="mailto:contact@is3a.nl" className={textLink}>
                  contact@is3a.nl
                </a>
              </li>
              <li className="text-muted-foreground tabular-nums">KvK 84535849</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
