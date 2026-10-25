import type { JSX } from "react";
import { Link } from "react-router";

import { SiteColumn, SiteSection, siteHeading, siteText } from "~/components/landing/site-grid";
import { cn } from "~/lib/utils";

import type { Route } from "./+types/home";

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

const featureHeading =
  "font-pt-sans px-2 py-3.5 text-[17.3333px] leading-[1.25] font-bold text-[#212121] md:text-[20px]";

function Spacer(): JSX.Element {
  return <div aria-hidden className="h-[88px]" />;
}

export default function Home(): JSX.Element {
  return (
    <div className="w-full">
      {/* Hero */}
      <SiteSection
        className="flex min-h-[344px] items-center bg-[#bd1900] bg-cover bg-center py-14 md:min-h-[464px]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(33 33 33 / 0.7), rgb(33 33 33 / 0.7)), url(/amsterdam-hero.jpg)",
        }}
      >
        <SiteColumn className="text-center">
          <h1 className="px-2 py-3.5 font-pt-sans text-[25.3333px] leading-[1.1] text-white md:text-[33.3333px]">
            Welcome to <span className="font-bold">IS3A</span>
          </h1>
          <p className={cn(siteText, "px-2 py-3.5 text-white italic")}>
            Information Sciences Association for Amsterdam Alumni
          </p>
        </SiteColumn>
      </SiteSection>

      <SiteSection>
        <SiteColumn className="text-center">
          <h2 className={cn(siteHeading, "px-2 py-3.5")}>IS3A in a nutshell</h2>
          <p className={cn(siteText, "px-2 py-3.5")}>
            The Information Sciences Association for Amsterdam Alumni (IS3A) is a new association
            for graduates of computer science, information science, and artificial intelligence
            studies located in Amsterdam. We are a community of both academic and commercial
            professionals that support each other with career advice, networking opportunities, and
            knowledge sharing. Four times a year we come together for drinks, lectures or workshops
            organized by our members.
          </p>
        </SiteColumn>
      </SiteSection>

      <SiteSection>
        <SiteColumn className="text-center">
          <h2 className={cn(siteHeading, "px-2 py-3.5")}>Who is IS3A for?</h2>
          <p className={cn(siteText, "px-2 py-3.5")}>
            Bachelor and Master graduates of any information science study from either UvA or VU.
            Please note that if you are still studying, this association might not be for you. Our
            events are catered to people currently working in tech or with a postgraduate academic
            career.
          </p>
        </SiteColumn>
      </SiteSection>

      <Spacer />

      {/* Features: image, text, image, text */}
      <SiteSection className="pb-[42px]" gridClassName="gap-y-12 px-12 md:gap-y-0 md:px-0">
        <SiteColumn className="md:col-span-3">
          <img src="/networking.jpg" alt="" className="block h-auto w-full" />
        </SiteColumn>
        <SiteColumn className="md:col-span-3">
          <h3 className={featureHeading}>Networking Opportunities</h3>
          <p className={cn(siteText, "px-2 py-3.5")}>
            Through our approachable activities we hope to bring you in contact with like-minded
            individuals working in the Amsterdam area.
          </p>
        </SiteColumn>
        <SiteColumn className="md:col-span-3">
          <img src="/knowledge-sharing.jpg" alt="" className="block h-auto w-full" />
        </SiteColumn>
        <SiteColumn className="md:col-span-3">
          <h3 className={featureHeading}>Knowledge Sharing</h3>
          <p className={cn(siteText, "px-2 py-3.5")}>
            Be it technical knowledge or soft skills. We'll give you the opportunity to share and
            learn. Not sure how to start negotiating your salary? Learn from your peers at IS3A!
          </p>
        </SiteColumn>
      </SiteSection>

      <Spacer />

      <SiteSection>
        <SiteColumn className="text-center md:col-span-6 md:col-start-4">
          <h2 className={cn(siteHeading, "px-2 py-3.5")}>Become a member!</h2>
          <p className={cn(siteText, "px-2 py-3.5 italic")}>
            Reap the benefits! Become a member now and get notified of all future activities.
          </p>
        </SiteColumn>
      </SiteSection>

      <SiteSection>
        <SiteColumn className="md:col-span-4 md:col-start-5">
          <Link
            to="/join"
            className="flex h-9 w-full items-center justify-center rounded bg-red-800 px-3 text-center font-merriweather text-[14.6667px] text-white transition-[filter] hover:brightness-110"
          >
            Become a member!
          </Link>
        </SiteColumn>
      </SiteSection>
    </div>
  );
}
