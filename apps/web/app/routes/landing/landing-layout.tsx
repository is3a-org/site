import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { SiteColumn, SiteSection, siteText } from "~/components/landing/site-grid";
import { cn } from "~/lib/utils";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/login", label: "Login" },
  { to: "/team", label: "Team" },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "font-pt-sans text-base leading-[normal] transition-colors hover:text-black/80",
    isActive ? "font-bold text-black/80" : "text-black/64",
  );

const footerLinkClass = "text-[#971400] underline";

export default function LandingLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-20 border-b bg-white",
          scrolled ? "border-[#ccc]" : "border-transparent",
        )}
      >
        <nav className="-mb-px flex h-14 items-center pr-6 pl-[11px] md:pl-4">
          <button
            className="-m-2 mr-[-7px] p-2 text-black/64 hover:text-black/80 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>

          <Link to="/" className="flex items-center">
            <img
              src="/is3a.png"
              alt="IS3A Logo"
              className="h-14 w-28 object-contain pt-2 pr-1 pb-2 pl-3"
            />
            <span className="font-pt-sans hidden px-3 text-xl font-bold text-black/80 md:inline-block">
              IS3A
            </span>
          </Link>

          <div className="ml-auto hidden items-center gap-[26px] md:flex">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} end className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Mobile Menu */}
        <div
          className={`grid bg-white transition-all duration-300 ease-in-out md:hidden ${
            mobileMenuOpen ? "grid-rows-[1fr] opacity-100 shadow-md" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-1 px-4 py-3">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  className={(state) => cn("block py-2", navLinkClass(state))}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-14">
        <Outlet />
      </main>

      {/* Footer */}
      <footer>
        <SiteSection>
          <SiteColumn>
            <div className={cn(siteText, "p-2 text-center")}>
              <p>
                <a
                  href="https://instagram.com/is3a.nl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLinkClass}
                >
                  🖼️ Instagram
                </a>{" "}
                |{" "}
                <a
                  href="https://www.linkedin.com/company/is3a/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLinkClass}
                >
                  🧑‍💼 LinkedIn
                </a>
              </p>
              <p className="mt-3">
                E:{" "}
                <a href="mailto:contact@is3a.nl" className={footerLinkClass}>
                  contact@is3a.nl
                </a>{" "}
                | KvK: 84535849 |{" "}
                <a
                  href="https://calendar.google.com/calendar/ical/c_ehjqad1bljvvebaed6gv2tb8vo%40group.calendar.google.com/public/basic.ics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLinkClass}
                >
                  Events iCal
                </a>
              </p>
            </div>
          </SiteColumn>
        </SiteSection>
      </footer>
    </div>
  );
}
