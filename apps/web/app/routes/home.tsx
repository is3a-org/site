import { Alert, AlertDescription, AlertTitle } from "@is3a/design-system/alert";
import { buttonVariants } from "@is3a/design-system/button";
import { CrossesDivider } from "@is3a/design-system/crosses";
import { ArrowRight, GraduationCap } from "lucide-react";
import type { JSX } from "react";
import { Link } from "react-router";

import { landingContainer, landingHeading } from "~/components/landing/landing-styles";
import { cn } from "~/lib/utils";

import type { Route } from "./+types/home";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "IS3A - Information Sciences Association for Amsterdam Alumni" },
    {
      name: "description",
      content:
        "The Information Sciences Association for Amsterdam Alumni (IS3A) is a new association for graduates of computer science, information science, and artificial intelligence studies located in Amsterdam.",
    },
  ];
}

// The name spells the acronym: I and S, then three A's. Initials are set in brand red.
const nameLines = [
  { initial: "I", rest: "nformation" },
  { initial: "S", rest: "ciences" },
  { initial: "A", rest: "ssociation", joiner: "for" },
  { initial: "A", rest: "msterdam" },
  { initial: "A", rest: "lumni" },
];

const facts = [
  {
    term: "4× a year",
    detail: "We come together for drinks, lectures, or workshops organized by our members.",
  },
  {
    term: "UvA + VU",
    detail: "For Bachelor and Master graduates of any information science study.",
  },
  {
    term: "CS · IS · AI",
    detail: "Computer science, information science, and artificial intelligence.",
  },
];

const features = [
  {
    title: "Networking opportunities",
    body: "Through our approachable activities we hope to bring you in contact with like-minded individuals working in the Amsterdam area.",
    image: { src: "/networking.jpg", width: 539, height: 557 },
  },
  {
    title: "Knowledge sharing",
    body: "Be it technical knowledge or soft skills, we'll give you the opportunity to share and learn. Not sure how to start negotiating your salary? Learn from your peers at IS3A!",
    image: { src: "/knowledge-sharing.jpg", width: 782, height: 808 },
  },
];

const photo =
  "w-full rounded-lg object-cover outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10";

export default function Home(): JSX.Element {
  return (
    <div className="w-full">
      <section
        className={cn(landingContainer, "grid gap-x-12 gap-y-8 pt-10 md:pt-16 lg:grid-cols-12")}
      >
        <h1 className="text-[clamp(3.25rem,10vw,6.75rem)] leading-[0.86] font-bold font-display tracking-[-0.01em] uppercase lg:col-span-7">
          {nameLines.map(({ initial, rest, joiner }) => (
            <span key={rest} className="block">
              <span className="text-primary">{initial}</span>
              {rest}
              {joiner !== undefined && (
                <>
                  {" "}
                  <span className="align-top text-[0.28em] font-semibold tracking-normal text-muted-foreground normal-case">
                    {joiner}
                  </span>
                </>
              )}{" "}
            </span>
          ))}
        </h1>
        <div className="flex flex-col justify-end gap-6 lg:col-span-5 lg:pb-2">
          <p className="max-w-md text-lg leading-relaxed text-pretty">
            A community for graduates of computer science, information science, and artificial
            intelligence in Amsterdam. Academic and commercial professionals who support each other
            with career advice, networking, and knowledge sharing.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/join" className={buttonVariants({ size: "lg" })}>
              Become a member
              <ArrowRight aria-hidden />
            </Link>
            <Link to="/team" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Meet the board
            </Link>
          </div>
        </div>
        <img
          src="/amsterdam-hero.jpg"
          alt="Canal houses along an Amsterdam canal"
          width={1024}
          height={411}
          className={cn(photo, "mt-4 aspect-[1024/411] min-h-48 lg:col-span-12")}
        />
      </section>

      <section aria-labelledby="facts-heading" className={cn(landingContainer, "py-16")}>
        <h2 id="facts-heading" className="sr-only">
          IS3A at a glance
        </h2>
        <dl className="grid gap-8 sm:grid-cols-3">
          {facts.map(({ term, detail }) => (
            <div key={term} className="border-t-2 border-ink pt-4">
              <dt className="text-4xl leading-none font-semibold font-display md:text-5xl">
                {term}
              </dt>
              <dd className="mt-3 max-w-xs leading-relaxed text-pretty text-muted-foreground">
                {detail}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className={landingContainer}>
        <CrossesDivider />
      </div>

      <section className={cn(landingContainer, "grid gap-6 pt-16 pb-12 md:grid-cols-12")}>
        <h2 className={cn(landingHeading, "md:col-span-4")}>IS3A in a nutshell</h2>
        <p className="max-w-[65ch] text-lg leading-relaxed text-pretty md:col-span-8">
          The Information Sciences Association for Amsterdam Alumni (IS3A) is a new association for
          graduates of computer science, information science, and artificial intelligence studies
          located in Amsterdam. We are a community of both academic and commercial professionals
          that support each other with career advice, networking opportunities, and knowledge
          sharing. Four times a year we come together for drinks, lectures or workshops organized by
          our members.
        </p>
      </section>

      <section className={cn(landingContainer, "grid gap-6 pt-4 pb-16 md:grid-cols-12")}>
        <h2 className={cn(landingHeading, "md:col-span-4")}>Who is IS3A for?</h2>
        <div className="max-w-[65ch] space-y-6 md:col-span-8">
          <p className="text-lg leading-relaxed text-pretty">
            Bachelor and Master graduates of any information science study from either UvA or VU.
          </p>
          <Alert>
            <GraduationCap />
            <AlertTitle>Still studying?</AlertTitle>
            <AlertDescription>
              This association might not be for you yet. Our events are catered to people currently
              working in tech or with a postgraduate academic career.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <section aria-labelledby="activities-heading" className={cn(landingContainer, "pb-20")}>
        <h2 id="activities-heading" className={landingHeading}>
          What we do
        </h2>
        <div className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-2">
          {features.map(({ title, body, image }) => (
            <article key={title}>
              <img
                src={image.src}
                alt=""
                width={image.width}
                height={image.height}
                loading="lazy"
                className={cn(photo, "aspect-[4/3]")}
              />
              <h3 className="mt-5 text-2xl leading-tight font-semibold font-display">{title}</h3>
              <p className="mt-2 max-w-prose leading-relaxed text-pretty text-muted-foreground">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Brand red in both themes: this band is the logo color, not the primary token. */}
      <section aria-labelledby="join-heading" className="bg-red-800 text-white">
        <div
          className={cn(
            landingContainer,
            "flex flex-col gap-8 py-16 md:flex-row md:items-end md:justify-between md:py-20",
          )}
        >
          <div className="max-w-xl space-y-4">
            <h2
              id="join-heading"
              className="text-5xl leading-[0.9] font-bold font-display uppercase md:text-6xl"
            >
              Become a member
            </h2>
            <p className="text-lg leading-relaxed text-pretty text-white/85">
              Reap the benefits! Become a member now and get notified of all future activities.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              to="/join"
              className={buttonVariants({
                size: "lg",
                className: "bg-white text-red-800 hover:bg-white/90",
              })}
            >
              Join IS3A
              <ArrowRight aria-hidden />
            </Link>
            <Link
              to="/login"
              className="font-medium underline decoration-white/50 decoration-2 underline-offset-4 transition-[text-decoration-color] hover:decoration-white"
            >
              Already a member? Log in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
