import type { JSX, ReactNode } from "react";

import { cn } from "~/lib/utils";

import { landingContainer } from "./landing-styles";

/** Opening of a public page: a condensed, logo-width title and a short lede. */
export function PageIntro({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>): JSX.Element {
  return (
    <section className={cn(landingContainer, "pt-12 pb-12 md:pt-20 md:pb-16")}>
      <h1 className="text-[clamp(3rem,9vw,5.5rem)] leading-[0.88] font-bold font-display text-balance uppercase">
        {title}
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
        {children}
      </p>
    </section>
  );
}
