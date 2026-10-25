import { ArrowUpRight } from "lucide-react";
import type { JSX } from "react";

import { landingContainer, landingPhoto } from "~/components/landing/landing-styles";
import { PageIntro } from "~/components/landing/page-intro";
import { cn } from "~/lib/utils";

import type { Route } from "./+types/former-speakers";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Former speakers - IS3A" },
    {
      name: "description",
      content:
        "At every IS3A drinks, one of our members gives a short talk about their work. These are the talks so far.",
    },
  ];
}

type Speaker = Readonly<{
  name: string;
  company: string;
  url?: string;
  title?: string;
  photo: Readonly<{ src: string; width: number; height: number }>;
  about: readonly string[];
}>;

// Most recent talk first.
const speakers: readonly Speaker[] = [
  {
    name: "Iris Meerman",
    company: "Nike",
    photo: { src: "/speakers/iris-meerman.jpg", width: 640, height: 639 },
    about: [
      "Iris is a Senior Data Engineer with real-world experience designing and building data infrastructure for large-scale enterprises.",
      "In her talk, Iris walked us through the complexities of setting up enterprise-grade data lake architectures. She shared key lessons from a project she did while working at DPG Media, where she was part of a team building scalable and maintainable data pipelines for analyzing user behavior, emphasizing why well-architected data storage and processing systems are more critical than ever with the increasing popularity of AI-driven applications.",
    ],
  },
  {
    name: "Micha de Groot",
    company: "BrainCreators",
    url: "https://www.braincreators.com/",
    photo: { src: "/speakers/micha-de-groot.jpg", width: 640, height: 639 },
    about: [
      "Micha de Groot is working as a Machine Learning Engineer at BrainCreators, a company that successfully transitioned from a consultancy firm to a product company with a live AI-based SaaS offering.",
      "In his talk, Micha shared the strategic decisions involved in making this transition, including how to select which idea to productize, which technologies to maintain or discard, and how to transform consultancy clients into recurring SaaS customers. He took us through the multiple pivots BrainCreators made and how they ultimately ended up with a complete SaaS solution for AI-driven maritime surveillance which is now one of their main products.",
    ],
  },
  {
    name: "Danny Dijkzeul",
    company: "Cover Genius",
    url: "https://covergenius.com/",
    photo: { src: "/speakers/danny-dijkzeul.jpg", width: 640, height: 639 },
    about: [
      "Danny Dijkzeul is a Senior Solutions Engineer at Cover Genius, a global insurtech company operating across multiple continents.",
      "In his talk, Danny gave us a glimpse into the life of working in a truly global role. He shared the challenges and rewards of collaborating across time zones and cultures, and offered valuable tips on international work travel and building strong global relationships.",
    ],
  },
  {
    name: "Yunus Demir",
    company: "Anywyse",
    url: "https://www.anywyse.audio/",
    photo: { src: "/speakers/yunus-demir.jpg", width: 640, height: 639 },
    about: [
      "Yunus Demir is working as a Lead Developer at Anywyse, an audio learning platform which leverages generative AI to transform educational documents into engaging audio lessons.",
      "In his talk, Yunus took us through Anywyse's journey of rolling out a very automated system which generates audio summaries and transforms the generated text into speech, and explained which obstacles they hit, like dealing with AI speech generators that didn't generate speech of high-enough quality yet, and the way they solved these problems and the lessons that they learned from them.",
    ],
  },
  {
    name: "Yuri Sturkenboom",
    company: "Cruit",
    url: "https://www.cruit.work/",
    photo: { src: "/speakers/yuri-sturkenboom.jpg", width: 640, height: 640 },
    about: [
      "Yuri Sturkenboom is the CTO and founder of Cruit, a startup that focuses on groundbreaking referral software.",
      "In his talk, Yuri told us about his journey from freelance developer to founding Cruit, and shared his knowledge on the significance of ERPs in the tech job market, the challenges they faced (entrepreneurial, technical, operational, acquisition), the benefits of outsourcing, and the experience of rolling out integrations with customer systems for the first time.",
    ],
  },
  {
    name: "Bram van den Akker",
    company: "Booking.com",
    title: "Your job is your business",
    photo: { src: "/speakers/bram-van-den-akker.jpg", width: 640, height: 568 },
    about: [
      "Bram van den Akker is a Senior Machine Learning Scientist at Booking.com.",
      "During his talk, Bram talked us through his journey of starting a new project on his own, and how you can still have an entrepreneurial mindset while working in a company.",
    ],
  },
  {
    name: "Roan de Jong",
    company: "De Roos Advocaten",
    title: "Regulating tech that doesn't exist (yet)",
    photo: { src: "/speakers/roan-de-jong.jpg", width: 640, height: 568 },
    about: [
      "Roan de Jong is working as a paralegal at De Roos Advocaten and has expertise in both Artificial Intelligence and the field of law.",
      "In his talk, Roan walked us through the challenges faced in legal regulations when attempting to regulate highly advanced fields like Artificial Intelligence, in particular the EU AI Act and how disruptive generative AI like ChatGPT has impacted it.",
    ],
  },
  {
    name: "Jelte Fennema",
    company: "Microsoft",
    photo: { src: "/speakers/jelte-fennema.jpg", width: 640, height: 567 },
    about: [
      "Jelte Fennema is a senior software engineer at Microsoft, where he works on the Citus database engine for PostgreSQL which in turn is used by Azure CosmosDB.",
      "In his talk, Jelte shared his work on the cancellation problem: the inability to predictively cancel queries sent to a horizontally scalable PostgreSQL setup. This problem occurs when cancellation database queries do not land on the same node that is executing the original query.",
    ],
  },
  {
    name: "Lennart Kerkvliet",
    company: "Vectornator by Linearity",
    url: "https://www.vectornator.io/",
    photo: { src: "/speakers/lennart-kerkvliet.jpg", width: 640, height: 567 },
    about: [
      "Lennart Kerkvliet is working as an iOS developer at Linearity, working on their app Vectornator, one of the leading vector design apps in the Apple landscape.",
      "In his talk, Lennart shared his experience developing and publishing Vectornator as a multi-platform graphic design tool and told us all about scaling applications to multiple native platforms while still providing a smooth user experience.",
    ],
  },
  {
    name: "Youri Voet",
    company: "CodeGrade",
    url: "https://www.codegrade.com/",
    photo: { src: "/speakers/youri-voet.jpg", width: 640, height: 586 },
    about: [
      "Youri Voet is one of the founders of CodeGrade: The Virtual Assistant for your coding classroom. CodeGrade started as a university project at the University of Amsterdam to make the lives of TAs for coding courses easier, and for students to get the feedback they need to be successful in computer science education.",
      "In his talk, Youri walked us through his journey at CodeGrade and how they became the number one company in programming education software.",
    ],
  },
];

function Company({ company, url }: Readonly<{ company: string; url?: string }>): JSX.Element {
  const className = "font-semibold font-display text-primary";
  if (url === undefined) {
    return <p className={className}>{company}</p>;
  }
  return (
    <p className={className}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 underline decoration-primary/30 decoration-2 underline-offset-4 transition-[text-decoration-color] hover:decoration-primary"
      >
        {company}
        <ArrowUpRight aria-hidden className="size-3.5" />
      </a>
    </p>
  );
}

export default function FormerSpeakers(): JSX.Element {
  return (
    <div className="w-full">
      <PageIntro title="Former speakers">
        At every drinks, we invite one of our members to give a short presentation about an
        interesting subject related to their work field.
      </PageIntro>

      <ul
        className={cn(
          landingContainer,
          "grid gap-x-8 gap-y-14 pb-20 md:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {speakers.map((speaker) => (
          <li key={speaker.name}>
            <article className="flex h-full flex-col">
              <img
                src={speaker.photo.src}
                alt=""
                width={speaker.photo.width}
                height={speaker.photo.height}
                loading="lazy"
                className={cn(landingPhoto, "aspect-[4/3] md:aspect-square")}
              />
              <div className="mt-5 border-t-2 border-ink pt-4">
                <h2 className="text-2xl leading-tight font-semibold font-display">
                  {speaker.name}
                </h2>
                <Company company={speaker.company} url={speaker.url} />
              </div>
              {speaker.title !== undefined && (
                <p className="mt-4 text-xl leading-snug font-semibold font-display text-balance">
                  “{speaker.title}”
                </p>
              )}
              <div className="mt-3 space-y-3 leading-relaxed text-pretty text-muted-foreground">
                {speaker.about.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
