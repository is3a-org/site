import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, Outlet } from "react-router";
import { IS3ALogo } from "~/components/icons/is3a";

export default function LandingLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <IS3ALogo className="h-8" />
            </Link>

            {/* Navigation Links */}
            <div className="hidden items-center space-x-8 md:flex">
              <Link to="/" className="text-gray-700 transition-colors hover:text-red-800">
                Home
              </Link>
              <Link to="/join" className="text-gray-700 transition-colors hover:text-red-800">
                Join
              </Link>
              <Link to="/login" className="text-gray-700 transition-colors hover:text-red-800">
                Login
              </Link>
              <Link to="/team" className="text-gray-700 transition-colors hover:text-red-800">
                Team
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="p-2 text-gray-600 hover:text-gray-900 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div
          className={`grid transition-all duration-300 ease-in-out md:hidden ${
            mobileMenuOpen
              ? "grid-rows-[1fr] border-t border-gray-200 opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-1 px-4 py-3">
              <Link
                to="/"
                className="block py-2 text-gray-700 transition-colors hover:text-red-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/join"
                className="block py-2 text-gray-700 transition-colors hover:text-red-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Join
              </Link>
              <Link
                to="/login"
                className="block py-2 text-gray-700 transition-colors hover:text-red-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/team"
                className="block py-2 text-gray-700 transition-colors hover:text-red-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Team
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <a
                href="https://instagram.com/is3a.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-red-800"
              >
                🖼️ Instagram
              </a>
              <span>|</span>
              <a
                href="https://www.linkedin.com/company/is3a/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-red-800"
              >
                🧑‍💼 LinkedIn
              </a>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>E:</span>
              <a href="mailto:contact@is3a.nl" className="transition-colors hover:text-red-800">
                contact@is3a.nl
              </a>
              <span>|</span>
              <span>KvK: 84535849</span>
              <span>|</span>
              <a
                href="https://calendar.google.com/calendar/ical/c_ehjqad1bljvvebaed6gv2tb8vo%40group.calendar.google.com/public/basic.ics"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-red-800"
              >
                Events iCal
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
