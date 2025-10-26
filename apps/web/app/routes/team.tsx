import type { Route } from "./+types/team";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Our Team - IS3A" },
    {
      name: "description",
      content: "Meet the team behind the Information Sciences Association for Amsterdam Alumni.",
    },
  ];
}

const teamMembers = [
  {
    name: "Board Member",
    role: "President",
    description: "Leading IS3A's vision and strategy",
    initials: "BM",
    color: "bg-red-800",
  },
  {
    name: "Board Member",
    role: "Vice President",
    description: "Supporting operations and member engagement",
    initials: "BM",
    color: "bg-blue-600",
  },
  {
    name: "Board Member",
    role: "Treasurer",
    description: "Managing finances and budgets",
    initials: "BM",
    color: "bg-green-600",
  },
  {
    name: "Board Member",
    role: "Secretary",
    description: "Coordinating communications and documentation",
    initials: "BM",
    color: "bg-purple-600",
  },
  {
    name: "Board Member",
    role: "Events Coordinator",
    description: "Organizing quarterly meetups and workshops",
    initials: "BM",
    color: "bg-orange-600",
  },
  {
    name: "Board Member",
    role: "Partnerships Lead",
    description: "Building relationships with universities and companies",
    initials: "BM",
    color: "bg-indigo-600",
  },
];

export default function Team() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-800 to-red-700 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-5xl font-bold">Our Team</h1>
          <p className="text-xl">Meet the dedicated volunteers making IS3A possible</p>
        </div>
      </section>

      {/* Team Introduction */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">The IS3A Board</h2>
          <p className="mb-8 text-lg leading-relaxed text-gray-700">
            IS3A is run entirely by volunteers who are passionate about fostering a strong community
            of information sciences alumni in Amsterdam. Our board members are all alumni
            themselves, working in various sectors of the tech industry.
          </p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl"
              >
                <div className="p-8">
                  {/* Avatar */}
                  <div className="mb-4 flex justify-center">
                    <div
                      className={`h-24 w-24 ${member.color} flex items-center justify-center rounded-full text-2xl font-bold text-white`}
                    >
                      {member.initials}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center">
                    <h3 className="mb-1 text-xl font-bold text-gray-900">{member.name}</h3>
                    <p className="mb-3 font-semibold text-red-800">{member.role}</p>
                    <p className="text-sm text-gray-600">{member.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join the Team CTA */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">Want to Get Involved?</h2>
          <p className="mb-8 text-lg leading-relaxed text-gray-700">
            We're always looking for passionate volunteers to help grow IS3A. Whether you want to
            join the board, help organize events, or contribute in other ways, we'd love to hear
            from you!
          </p>
          <a
            href="mailto:contact@is3a.nl"
            className="inline-block rounded-md bg-red-800 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-red-700"
          >
            Get in Touch
          </a>
        </div>
      </section>

      {/* Alumni Section */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">Alumni Community</h2>
          <p className="text-lg leading-relaxed text-gray-700">
            IS3A represents graduates from the University of Amsterdam (UvA) and Vrije Universiteit
            Amsterdam (VU) across various information sciences programs including Computer Science,
            Information Science, Artificial Intelligence, and related fields. Together, we create a
            vibrant community that supports professional growth and lifelong learning.
          </p>
        </div>
      </section>
    </div>
  );
}
