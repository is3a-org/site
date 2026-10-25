import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Button } from "./components/button";
import { Crosses, CrossesDivider, CrossesLoader } from "./components/crosses";
import { Tabs, TabsList, TabsTrigger } from "./components/tabs";

const meta = { title: "Foundations/Brand" } satisfies Meta;
export default meta;

const palette = [
  { name: "Amsterdam red", value: "#bd1900", use: "Brand, primary actions, and errors" },
  { name: "Ink", value: "#000000", use: "Brackets, crosses, focus, and table rules" },
  { name: "Paper", value: "#ffffff", use: "Page and card surfaces" },
  { name: "Klinker", value: "#eceeed", use: "Hover, secondary, and muted surfaces" },
  { name: "Gracht", value: "#23675a", use: "Active, paid, and other positive states" },
];

export function BracketAndCross(): ReactElement {
  return (
    <div className="max-w-3xl space-y-14">
      <section className="flex items-center gap-5">
        <span aria-hidden="true" className="flex h-24 items-stretch text-ink">
          <span className="w-3 border-y-[6px] border-l-[6px] border-current" />
          <Crosses orientation="vertical" className="h-auto w-6 self-center py-2" />
        </span>
        <div className="space-y-2">
          <h1 className="text-6xl leading-none font-semibold font-display text-primary">IS3A</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Bracket and cross: a code bracket around Amsterdam&apos;s three crosses. Every pattern
            below comes from the logo.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-semibold font-display">The bracket marks what is current</h2>
        <p className="max-w-xl text-pretty">
          The current page, the selected tab, and today&apos;s date are bracketed. Only one thing in
          a group carries the bracket, so it always answers &ldquo;where am I?&rdquo; Keyboard focus
          uses a square ink outline of the same weight.
        </p>
        <Tabs defaultValue="members">
          <TabsList aria-label="Example sections">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-semibold font-display">The crosses wait and divide</h2>
        <p className="max-w-xl text-pretty">
          While something loads, the crosses light up one after another. Between major sections they
          act as a divider. They are never used as icons for closing or removing.
        </p>
        <div className="flex items-center gap-6">
          <CrossesLoader label="Loading members" />
          <Button disabled>
            <CrossesLoader label="Saving" className="text-current" />
            Saving
          </Button>
        </div>
        <CrossesDivider className="max-w-md" />
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-semibold font-display">Palette</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {palette.map(({ name, value, use }) => (
            <li key={name} className="flex items-center gap-3">
              <span
                className="size-12 shrink-0 rounded-md outline outline-1 -outline-offset-1 outline-black/10"
                style={{ backgroundColor: value }}
              />
              <span>
                <span className="block text-lg leading-tight font-semibold font-display">
                  {name}
                </span>
                <span className="block text-sm text-muted-foreground">{use}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
