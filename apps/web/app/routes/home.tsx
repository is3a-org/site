import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "IS3A - Information Sciences Association for Amsterdam Alumni" },
    {
      name: "description",
      content:
        "The Information Sciences Association for Amsterdam Alumni (IS3A) is a new association for graduates of computer science, information science, and artificial intelligence studies located in Amsterdam.",
    },
  ];
}

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section with Parallax */}
      <section className="relative h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-fixed bg-center"
          style={{
            backgroundImage: `url(/amsterdam-hero.jpg)`,
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full items-center justify-center px-4 text-center text-white">
          <div>
            <h1 className="mb-4 text-5xl font-bold md:text-6xl">Welcome to IS3A</h1>
            <p className="text-xl italic md:text-2xl">
              Information Sciences Association for Amsterdam Alumni
            </p>
          </div>
        </div>
      </section>

      {/* IS3A in a nutshell */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-red-800">IS3A in a nutshell</h2>
          <p className="text-lg leading-relaxed text-gray-700">
            The Information Sciences Association for Amsterdam Alumni (IS3A) is a new association
            for graduates of computer science, information science, and artificial intelligence
            studies located in Amsterdam. We are a community of both academic and commercial
            professionals that support each other with career advice, networking opportunities, and
            knowledge sharing. Four times a year we come together for drinks, lectures or workshops
            organized by our members.
          </p>
        </div>
      </section>

      {/* Who is IS3A for? */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-red-800">Who is IS3A for?</h2>
          <p className="text-lg leading-relaxed text-gray-700">
            Bachelor and Master graduates of any information science study from either UvA or VU.
            Please note that if you are still studying, this association might not be for you. Our
            events are catered to people currently working in tech or with a postgraduate academic
            career.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          {/* Networking Opportunities */}
          <div className="overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="h-48 bg-gradient-to-br from-pink-500 to-purple-600" />
            <div className="p-6">
              <h3 className="mb-4 text-2xl font-bold text-gray-900">Networking Opportunities</h3>
              <p className="leading-relaxed text-gray-700">
                Through our approachable activities we hope to bring you in contact with like-minded
                individuals working in the Amsterdam area.
              </p>
            </div>
          </div>

          {/* Knowledge Sharing */}
          <div className="overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600" />
            <div className="p-6">
              <h3 className="mb-4 text-2xl font-bold text-gray-900">Knowledge Sharing</h3>
              <p className="leading-relaxed text-gray-700">
                Be it technical knowledge or soft skills. We'll give you the opportunity to share
                and learn. Not sure how to start negotiating your salary? Learn from your peers at
                IS3A!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-red-800">Become a member!</h2>
          <p className="mb-8 text-lg leading-relaxed text-gray-700">
            Reap the benefits! Become a member now and get notified of all future activities.
          </p>
          <Link
            to="/join"
            className="inline-block rounded-md bg-red-800 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-red-700"
          >
            Become a member!
          </Link>
        </div>
      </section>
    </div>
  );
}
