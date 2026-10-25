import { Button } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { FieldLegend, FieldSet } from "@is3a/design-system/field";
import { Input } from "@is3a/design-system/input";
import { Label } from "@is3a/design-system/label";
import { RadioGroup, RadioGroupItem } from "@is3a/design-system/radio-group";
import type { JSX, ReactNode } from "react";

import { landingContainer, landingHeading, textLink } from "~/components/landing/landing-styles";
import { PageIntro } from "~/components/landing/page-intro";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { cn } from "~/lib/utils";

import type { Route } from "./+types/join";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Join IS3A - Become a Member" },
    {
      name: "description",
      content:
        "Join the Information Sciences Association for Amsterdam Alumni and connect with like-minded professionals in the Amsterdam tech community.",
    },
  ];
}

interface JoinLoaderData {
  readonly currentYear: number;
}

export function loader(): JoinLoaderData {
  return { currentYear: new Date().getFullYear() };
}

const benefits = [
  {
    term: "Networking",
    detail: "Connect with fellow alumni working in tech across Amsterdam.",
  },
  {
    term: "Knowledge sharing",
    detail: "Learn from workshops, lectures, and peer experiences.",
  },
  {
    term: "Quarterly events",
    detail: "Attend exclusive drinks, talks, and social gatherings.",
  },
];

const universities = [
  { value: "UvA", label: "University of Amsterdam (UvA)" },
  { value: "VU", label: "Vrije Universiteit (VU)" },
];

function TextField({
  id,
  label,
  children,
}: Readonly<{ id: string; label: string; children: ReactNode }>): JSX.Element {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export default function Join({
  loaderData,
}: ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  return (
    <div className="w-full">
      <PageIntro title="Join IS3A">
        Become part of Amsterdam's premier information sciences alumni network.
      </PageIntro>

      <section aria-labelledby="benefits-heading" className={cn(landingContainer, "pb-16")}>
        <h2 id="benefits-heading" className="sr-only">
          Membership benefits
        </h2>
        <dl className="grid gap-8 sm:grid-cols-3">
          {benefits.map(({ term, detail }) => (
            <div key={term} className="border-t-2 border-ink pt-4">
              <dt className="text-2xl leading-tight font-semibold font-display">{term}</dt>
              <dd className="mt-2 leading-relaxed text-pretty text-muted-foreground">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-muted py-16">
        <div className={cn(landingContainer, "max-w-2xl")}>
          <Card className="gap-8 py-8">
            <CardHeader className="px-6 md:px-8">
              <CardTitle className="text-3xl">Membership application</CardTitle>
              <CardDescription>
                All fields are required unless marked optional. We'll review your application and
                get back to you soon!
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 md:px-8">
              <form className="grid gap-6">
                <TextField id="name" label="Full name">
                  <Input id="name" name="name" autoComplete="name" required />
                </TextField>
                <TextField id="email" label="Email address">
                  <Input id="email" name="email" type="email" autoComplete="email" required />
                </TextField>
                <FieldSet className="gap-3">
                  <FieldLegend variant="label" className="mb-3">
                    University
                  </FieldLegend>
                  <RadioGroup name="university" required>
                    {universities.map(({ value, label }) => (
                      <Label key={value} className="flex items-center gap-3 font-normal">
                        <RadioGroupItem value={value} />
                        {label}
                      </Label>
                    ))}
                  </RadioGroup>
                </FieldSet>
                <TextField id="degree" label="Degree program">
                  <Input
                    id="degree"
                    name="degree"
                    placeholder="e.g., Computer Science, Artificial Intelligence"
                    required
                  />
                </TextField>
                <TextField id="graduationYear" label="Graduation year">
                  <Input
                    id="graduationYear"
                    name="graduationYear"
                    type="number"
                    inputMode="numeric"
                    min="1950"
                    max={loaderData.currentYear}
                    className="w-32 tabular-nums"
                    required
                  />
                </TextField>
                <TextField id="linkedin" label="LinkedIn profile (optional)">
                  <Input
                    id="linkedin"
                    name="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                </TextField>
                <Button type="submit" size="lg" className="mt-2 w-full">
                  Submit application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className={cn(landingContainer, "py-16")}>
        <h2 className={landingHeading}>Questions?</h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-pretty">
          Feel free to reach out if you have any questions about membership:{" "}
          <a href="mailto:contact@is3a.nl" className={textLink}>
            contact@is3a.nl
          </a>
        </p>
      </section>
    </div>
  );
}
