import { buttonVariants } from "@is3a/design-system/button";
import type { JSX } from "react";
import { Link } from "react-router";

import {
  landingContainer,
  landingHeading,
  landingPhoto,
  textLink,
} from "~/components/landing/landing-styles";
import { PageIntro } from "~/components/landing/page-intro";
import { cn } from "~/lib/utils";

import type { Route } from "./+types/team";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Our Team - IS3A" },
    {
      name: "description",
      content: "Meet the board behind the Information Sciences Association for Amsterdam Alumni.",
    },
  ];
}

// Photos are 640px tall and nearly square; the page crops them to a square.
const board = [
  {
    name: "Kjeld Oostra",
    photo: "/team/kjeld-oostra.jpg",
    work: "Founder, AI prototyping and consultancy",
    studies: "BSc Artificial Intelligence, MSc Data Science · UvA",
    bio: [
      "Hi! I'm Kjeld. I followed my bachelors in Artificial Intelligence and my masters in Data Science at the University of Amsterdam. During my studies, I've been in the board of Study Association VIA for a full-time year, as well as another year as the Faculty of Science delegate in the Central Student Council. Additionally, I've worked as a commercial manager at Copernica for 4 years, after several other software engineering jobs. This came with a considerable study delay (worth it!), and finally after graduation, I wanted to do something that combined my commercial experience with my interest and background in AI and Data Science. I decided to start my own business in AI prototyping and consultancy. This means I'm working with multiple clients on various projects for automating or optimizing processes, as well as building AI functionality into existing solutions.",
      "I started this business during the COVID pandemic, so I built all relationships up from home. Since I could conduct all business remotely even after most COVID-restrictions were lifted, I noticed I could do this from wherever I wanted, and so I decided to move to Spain in 2021. Besides obvious perks such as good weather all year long and great food and wine, this does mean it's more difficult to meet kindred spirits in the IT/AI field. And so, one of the reasons why we founded IS3A became even more so relevant for myself :)",
    ],
  },
  {
    name: "Jan Schutte",
    photo: "/team/jan-schutte.jpg",
    work: "Data Platform Engineer at Adyen",
    studies: "MSc Artificial Intelligence · UvA, 2021",
    bio: [
      "Hey, I'm Jan and I've graduated in 2021 from the master Artificial Intelligence at the University of Amsterdam. During my studies I've worked part-time as a frontend engineer and as a Python developer, now I am employed at Adyen as a Data Platform Engineer. My job is to enable data scientists, machine learning engineers and business analysts to create models and products on top of our on-premise petabyte data processing cluster. I utilize a variety of open-source technologies, such as Spark, Hadoop, Delta Lake, Airflow, and MLflow, in my work. I helped start IS3A because I wanted to keep a connection to the great people I've met at my studies and wanted to continue developing contacts in adjacent fields.",
    ],
  },
  {
    name: "Wilco Kruijer",
    photo: "/team/wilco-kruijer.jpg",
    work: "Software Engineer at Adyen",
    studies: "MSc Software Engineering · UvA, 2020",
    bio: [
      "Graduated in 2020 from the Software Engineering master programme at the UvA. Now working for Adyen as a Software Engineer. Adyen is known as a payment service provider, but is now also entering the Embedded Financial Products market, which is the part of the company I work for. In short, we built a bank from the ground up. Connections to other banks, SWIFT, internal accounting system, etc. Long story short: we sell banking as a service. Enables platforms to offer bank accounts to their customers. Specifically I work on the core of the bank which includes the accounting system and systems related to transfers. We enable other teams to build products on top of the banking infrastructure.",
    ],
  },
  {
    name: "Lorian Coltof",
    photo: "/team/lorian-coltof.jpg",
    work: "Software Engineer at IMC Trading",
    studies: "BSc Computer Science, MSc Artificial Intelligence · UvA",
    bio: [
      "Hi, I am Lorian and I graduated from the master Artificial Intelligence and from the bachelor Computer Science at the University of Amsterdam. While studying, I've worked as a part-time software engineer at SSL Leiden, and worked there full-time for a little over a year after I graduated from my master. At SSL Leiden, I worked on an application for automating email sending, migrated the deployment of all applications to a small-scale Kubernetes cluster, and led the development of a new application consisting of a C# GraphQL backend and a TypeScript and Vue.js frontend. Starting from February, I will be working as a software engineer at IMC Trading, a technology-driven trading firm and market maker active all around the world.",
    ],
  },
  {
    name: "Mick Vermeulen",
    photo: "/team/mick-vermeulen.jpg",
    work: "Developer at IMC Trading",
    studies: "BSc Computer Science, MSc Data Science · UvA",
    bio: [
      "I'm Mick, I graduated with a masters in Data Science and a bachelors in Computer Science at the University of Amsterdam. Next to these studies, I've always had relevant parttime jobs to allow me to put my studies to practice. I worked at a marketing agency after switching to a healthcare software provider and finally switched to my current job: developer at IMC Trading, a high frequency trading firm. At IMC I mostly work with Python and TypeScript using libraries with a focus on data processing and visualisation. IMC collects massive amounts of market data that contain exciting opportunities, the struggle is making this data accessible and visualising it in a way that makes it easy to explore and understand. This includes close work with traders, which always results in interesting dynamics and collaborations on solving tough challenges at scale.",
    ],
  },
];

export default function Team(): JSX.Element {
  return (
    <div className="w-full">
      <PageIntro title="Our team">
        The board consists of five people with ample knowledge in running an association. They're
        committed to providing amazing activities in the coming years.
      </PageIntro>

      <section aria-labelledby="board-heading" className={cn(landingContainer, "pb-16")}>
        <h2 id="board-heading" className="sr-only">
          The IS3A board
        </h2>
        <ul className="grid gap-14">
          {board.map((member) => (
            <li
              key={member.name}
              className="grid items-start gap-6 border-t-2 border-ink pt-8 sm:grid-cols-[10rem_1fr] md:grid-cols-12 md:gap-x-8"
            >
              <img
                src={member.photo}
                alt=""
                width={640}
                height={640}
                loading="lazy"
                className={cn(
                  landingPhoto,
                  "aspect-square max-w-40 sm:max-w-none md:col-span-4 md:row-span-2 lg:col-span-3 lg:row-span-1",
                )}
              />
              <div className="md:col-span-8 lg:col-span-3">
                <h3 className="text-3xl leading-none font-semibold font-display">{member.name}</h3>
                <p className="mt-3 font-semibold font-display text-primary">{member.work}</p>
                <p className="mt-1 text-sm text-muted-foreground">{member.studies}</p>
              </div>
              <div className="max-w-[65ch] space-y-4 leading-relaxed text-pretty sm:col-span-2 md:col-span-8 lg:col-span-6">
                {member.bio.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-muted py-16">
        <div className={cn(landingContainer, "grid gap-6 md:grid-cols-12")}>
          <h2 className={cn(landingHeading, "md:col-span-4")}>Interested in helping out?</h2>
          <div className="max-w-[65ch] space-y-6 md:col-span-8">
            <p className="text-lg leading-relaxed text-pretty">
              Interested in being part of the board? Let us know at one of our activities or send us
              an email. Curious what our drinks are like? See the{" "}
              <Link to="/former-speakers" className={textLink}>
                talks members gave
              </Link>
              .
            </p>
            <a href="mailto:contact@is3a.nl" className={buttonVariants({ size: "lg" })}>
              Get in touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
