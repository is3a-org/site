import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

const meta = { title: "Foundations/Typography" } satisfies Meta;
export default meta;

export function Interface(): ReactElement {
  return (
    <div className="max-w-2xl space-y-6 font-sans">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your IS3A membership</h1>
        <p className="text-sm text-muted-foreground">Inter · interface text</p>
      </div>
      <h2 className="text-2xl font-semibold">Manage your account</h2>
      <h3 className="text-lg font-semibold">Membership details</h3>
      <p className="text-base leading-relaxed">
        Keep your contact details up to date, view your membership, and register for association
        activities. Body copy should be concise and readable at every screen size.
      </p>
      <p className="text-sm text-muted-foreground">Secondary text explains the next step.</p>
      <p className="text-sm font-medium">Full membership</p>
      <p className="text-2xl font-semibold tabular-nums">1,234 members</p>
    </div>
  );
}

export function PublicWebsite(): ReactElement {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-pt-sans text-4xl font-bold text-red-800">IS3A</h1>
      <p className="text-sm text-muted-foreground">PT Sans · public website headings</p>
      <p className="font-merriweather text-base leading-relaxed">
        Welcome to IS3A. Find information about the association, explore membership options, and
        stay connected with our community.
      </p>
      <p className="text-sm text-muted-foreground">Merriweather · public website body text</p>
    </div>
  );
}
