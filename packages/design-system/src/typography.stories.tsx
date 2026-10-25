import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

const meta = { title: "Foundations/Typography" } satisfies Meta;
export default meta;

export function Interface(): ReactElement {
  return (
    <div className="max-w-2xl space-y-6 font-sans">
      <div className="space-y-2">
        <h1 className="text-5xl leading-none font-semibold font-display">Your IS3A membership</h1>
        <p className="text-sm text-muted-foreground">
          Archivo at 72% width for display, echoing the logo&apos;s tall letters.
        </p>
      </div>
      <h2 className="text-3xl font-semibold font-display">Manage your account</h2>
      <h3 className="text-xl font-semibold font-display">Membership details</h3>
      <p className="text-base leading-relaxed">
        Keep your contact details up to date, view your membership, and register for association
        activities. Body copy should be concise and readable at every screen size.
      </p>
      <p className="text-sm text-muted-foreground">
        Archivo at normal width for reading. Secondary text explains the next step.
      </p>
      <p className="text-sm font-medium">Full membership</p>
      <p className="text-2xl font-semibold tabular-nums">1,234 members</p>
    </div>
  );
}

export function PublicWebsite(): ReactElement {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-7xl leading-[0.86] font-bold font-display uppercase">
        <span className="text-primary">I</span>nformation
        <br />
        <span className="text-primary">S</span>ciences
      </h1>
      <p className="text-sm text-muted-foreground">
        Archivo display, bold and uppercase · public page titles
      </p>
      <p className="text-lg leading-relaxed text-pretty">
        Welcome to IS3A. Find information about the association, explore membership options, and
        stay connected with our community.
      </p>
      <p className="text-sm text-muted-foreground">Archivo · public website body text at 18px</p>
    </div>
  );
}
