import { Link, Outlet } from "react-router";

export default function LandingLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-red-600">IS3A</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden items-center space-x-8 md:flex">
              <Link to="/" className="text-gray-700 transition-colors hover:text-red-600">
                Home
              </Link>
              <Link to="/join" className="text-gray-700 transition-colors hover:text-red-600">
                Join
              </Link>
              <Link to="/team" className="text-gray-700 transition-colors hover:text-red-600">
                Team
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="p-2 text-gray-600 hover:text-gray-900 md:hidden">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </nav>
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
                className="transition-colors hover:text-red-600"
              >
                🖼️ Instagram
              </a>
              <span>|</span>
              <a
                href="https://www.linkedin.com/company/is3a/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-red-600"
              >
                🧑‍💼 LinkedIn
              </a>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>E:</span>
              <a href="mailto:contact@is3a.nl" className="transition-colors hover:text-red-600">
                contact@is3a.nl
              </a>
              <span>|</span>
              <span>KvK: 84535849</span>
              <span>|</span>
              <a
                href="https://calendar.google.com/calendar/ical/c_ehjqad1bljvvebaed6gv2tb8vo%40group.calendar.google.com/public/basic.ics"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-red-600"
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
