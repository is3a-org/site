import type { Route } from "./+types/join";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Join IS3A - Become a Member" },
    {
      name: "description",
      content:
        "Join the Information Sciences Association for Amsterdam Alumni and connect with like-minded professionals in the Amsterdam tech community.",
    },
  ];
}

export default function Join() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-800 to-red-700 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-5xl font-bold">Join IS3A</h1>
          <p className="text-xl">
            Become part of Amsterdam's premier information sciences alumni network
          </p>
        </div>
      </section>

      {/* Membership Benefits */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Membership Benefits
          </h2>

          <div className="mb-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Networking</h3>
              <p className="text-gray-600">
                Connect with fellow alumni working in tech across Amsterdam
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Knowledge Sharing</h3>
              <p className="text-gray-600">Learn from workshops, lectures, and peer experiences</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Quarterly Events</h3>
              <p className="text-gray-600">Attend exclusive drinks, talks, and social gatherings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Form Section */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
              Membership Application
            </h2>

            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label
                  htmlFor="university"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  University *
                </label>
                <select
                  id="university"
                  name="university"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600"
                >
                  <option value="">Select your university</option>
                  <option value="uva">University of Amsterdam (UvA)</option>
                  <option value="vu">Vrije Universiteit Amsterdam (VU)</option>
                </select>
              </div>

              <div>
                <label htmlFor="degree" className="mb-2 block text-sm font-medium text-gray-700">
                  Degree Program *
                </label>
                <input
                  type="text"
                  id="degree"
                  name="degree"
                  placeholder="e.g., Computer Science, Artificial Intelligence"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label
                  htmlFor="graduation"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Graduation Year *
                </label>
                <input
                  type="number"
                  id="graduation"
                  name="graduation"
                  min="1990"
                  max={new Date().getFullYear()}
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label htmlFor="linkedin" className="mb-2 block text-sm font-medium text-gray-700">
                  LinkedIn Profile (optional)
                </label>
                <input
                  type="url"
                  id="linkedin"
                  name="linkedin"
                  placeholder="https://linkedin.com/in/your-profile"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full rounded-md bg-red-800 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-red-700"
                >
                  Submit Application
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              * Required fields. We'll review your application and get back to you soon!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Questions?</h2>
          <p className="mb-6 text-gray-700">
            Feel free to reach out if you have any questions about membership.
          </p>
          <a
            href="mailto:contact@is3a.nl"
            className="font-semibold text-red-800 hover:text-red-700"
          >
            contact@is3a.nl
          </a>
        </div>
      </section>
    </div>
  );
}
