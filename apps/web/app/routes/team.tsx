import { buttonVariants } from "@is3a/design-system/button";
import type { JSX } from "react";

import { landingContainer, landingHeading } from "~/components/landing/landing-styles";
import { PageIntro } from "~/components/landing/page-intro";
import { cn } from "~/lib/utils";

import type { Route } from "./+types/team";

export function meta(): Route.MetaDescriptors {
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
  },
  {
    name: "Board Member",
    role: "Vice President",
    description: "Supporting operations and member engagement",
    initials: "BM",
  },
  {
    name: "Board Member",
    role: "Treasurer",
    description: "Managing finances and budgets",
    initials: "BM",
  },
  {
    name: "Board Member",
    role: "Secretary",
    description: "Coordinating communications and documentation",
    initials: "BM",
  },
  {
    name: "Board Member",
    role: "Events Coordinator",
    description: "Organizing quarterly meetups and workshops",
    initials: "BM",
  },
  {
    name: "Board Member",
    role: "Partnerships Lead",
    description: "Building relationships with universities and companies",
    initials: "BM",
  },
];

export default function Team(): JSX.Element {
  return (
    <div className="w-full">
      <PageIntro title="Our team">Meet the dedicated volunteers making IS3A possible.</PageIntro>

      <section className={cn(landingContainer, "grid gap-6 pb-16 md:grid-cols-12")}>
        <h2 className={cn(landingHeading, "md:col-span-4")}>The IS3A board</h2>
        <p className="max-w-[65ch] text-lg leading-relaxed text-pretty md:col-span-8">
          IS3A is run entirely by volunteers who are passionate about fostering a strong community
          of information sciences alumni in Amsterdam. Our board members are all alumni themselves,
          working in various sectors of the tech industry.
        </p>
      </section>

      <section className="bg-muted py-16">
        <ul className={cn(landingContainer, "grid gap-6 sm:grid-cols-2 lg:grid-cols-3")}>
          {teamMembers.map((member) => (
            <li
              key={member.role}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-5 text-card-foreground"
            >
              <span
                aria-hidden
                className="grid size-14 shrink-0 place-items-center rounded-md bg-ink text-xl font-semibold font-display text-background"
              >
                {member.initials}
              </span>
              <div className="min-w-0">
                <h3 className="text-xl leading-tight font-semibold font-display">{member.name}</h3>
                <p className="font-semibold font-display text-primary">{member.role}</p>
                <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {member.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={cn(landingContainer, "grid gap-6 py-16 md:grid-cols-12")}>
        <h2 className={cn(landingHeading, "md:col-span-4")}>Want to get involved?</h2>
        <div className="max-w-[65ch] space-y-6 md:col-span-8">
          <p className="text-lg leading-relaxed text-pretty">
            We're always looking for passionate volunteers to help grow IS3A. Whether you want to
            join the board, help organize events, or contribute in other ways, we'd love to hear
            from you!
          </p>
          <a href="mailto:contact@is3a.nl" className={buttonVariants({ size: "lg" })}>
            Get in touch
          </a>
        </div>
      </section>

      <section className={cn(landingContainer, "grid gap-6 pb-20 md:grid-cols-12")}>
        <h2 className={cn(landingHeading, "md:col-span-4")}>Alumni community</h2>
        <p className="max-w-[65ch] text-lg leading-relaxed text-pretty md:col-span-8">
          IS3A represents graduates from the University of Amsterdam (UvA) and Vrije Universiteit
          Amsterdam (VU) across various information sciences programs including Computer Science,
          Information Science, Artificial Intelligence, and related fields. Together, we create a
          vibrant community that supports professional growth and lifelong learning.
        </p>
      </section>
    </div>
  );
}
