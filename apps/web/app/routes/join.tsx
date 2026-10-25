import { Alert, AlertDescription } from "@is3a/design-system/alert";
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
import { CheckCircle2 } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { Form, useNavigation } from "react-router";

import { landingContainer, landingHeading, textLink } from "~/components/landing/landing-styles";
import { PageIntro } from "~/components/landing/page-intro";
import { createFormsServer } from "~/fragno/forms-server";
import {
  membershipRequestForm,
  type MembershipRequestData,
} from "~/fragno/membership-request-form";
import type { ReadonlyRouteProps } from "~/fragno/readonly-route-props";
import { readFormText } from "~/fragno/request-form";
import { cn } from "~/lib/utils";
import { requestContext } from "~/request-context";

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

type RequestValues = Readonly<{
  name: string;
  email: string;
  university: string;
  degree: string;
  graduationYear: string;
  linkedin: string;
}>;

type JoinActionData =
  | Readonly<{ status: "sent" }>
  | Readonly<{ status: "error"; message: string; values: RequestValues }>;

/** Stores the request as a submission of the static membership request form. */
export async function action({
  request,
  context,
}: Readonly<Route.ActionArgs>): Promise<JoinActionData> {
  const formData = await request.formData();
  // People never see this field; bots that fill in everything get a quiet success.
  if ((readFormText(formData, "website") ?? "") !== "") {
    return { status: "sent" };
  }

  const read = (field: string): string => (readFormText(formData, field) ?? "").trim();
  const values: RequestValues = {
    name: read("name"),
    email: read("email"),
    university: read("university"),
    degree: read("degree"),
    graduationYear: read("graduationYear"),
    linkedin: read("linkedin"),
  };
  const data: MembershipRequestData = {
    name: values.name,
    email: values.email,
    university: values.university,
    degree: values.degree,
    graduationYear: Number(values.graduationYear),
  };
  // LinkedIn is optional; an empty string would fail the URL format.
  if (values.linkedin !== "") {
    data.linkedin = values.linkedin;
  }

  const response = await createFormsServer(context.get(requestContext).pool).callRoute(
    "POST",
    "/:slug/submit",
    {
      pathParams: { slug: membershipRequestForm.slug },
      headers: request.headers,
      body: { data },
    },
  );

  if (response.type === "json") {
    return { status: "sent" };
  }
  const message =
    response.type === "error" && response.error.code === "VALIDATION_ERROR"
      ? `Some details don't look right: ${response.error.message}`
      : "Something went wrong on our side. Please try again, or email us instead.";
  return { status: "error", message, values };
}

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
  actionData,
}: ReadonlyRouteProps<Route.ComponentProps>): JSX.Element {
  const submitting = useNavigation().state === "submitting";
  const values = actionData?.status === "error" ? actionData.values : undefined;

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
            {actionData?.status === "sent" ? (
              <CardHeader className="px-6 md:px-8">
                <output className="contents">
                  <CheckCircle2 aria-hidden className="mb-2 size-8 text-success" />
                  <CardTitle className="text-3xl">Request received</CardTitle>
                  <CardDescription className="text-base">
                    Thanks for your interest in IS3A! The board reviews every request and will get
                    back to you by email.
                  </CardDescription>
                </output>
              </CardHeader>
            ) : (
              <>
                <CardHeader className="px-6 md:px-8">
                  <CardTitle className="text-3xl">Request membership</CardTitle>
                  <CardDescription>
                    Tell us a bit about yourself. The board reviews every request and gets back to
                    you by email.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 md:px-8">
                  <Form method="post" preventScrollReset className="grid gap-6">
                    {actionData?.status === "error" && (
                      <Alert variant="destructive" role="alert">
                        <AlertDescription>{actionData.message}</AlertDescription>
                      </Alert>
                    )}
                    <TextField id="name" label="Full name">
                      <Input
                        id="name"
                        name="name"
                        autoComplete="name"
                        defaultValue={values?.name}
                        required
                      />
                    </TextField>
                    <TextField id="email" label="Email address">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        defaultValue={values?.email}
                        required
                      />
                    </TextField>
                    <FieldSet className="gap-3">
                      <FieldLegend variant="label" className="mb-3">
                        University
                      </FieldLegend>
                      <RadioGroup name="university" defaultValue={values?.university} required>
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
                        defaultValue={values?.degree}
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
                        defaultValue={values?.graduationYear}
                        required
                      />
                    </TextField>
                    <TextField id="linkedin" label="LinkedIn profile (optional)">
                      <Input
                        id="linkedin"
                        name="linkedin"
                        type="url"
                        placeholder="https://linkedin.com/in/your-profile"
                        defaultValue={values?.linkedin}
                      />
                    </TextField>
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden
                      className="sr-only"
                    />
                    <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting}>
                      {submitting ? "Sending request…" : "Send request"}
                    </Button>
                  </Form>
                </CardContent>
              </>
            )}
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
