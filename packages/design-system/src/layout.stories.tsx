import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

const meta = { title: "Foundations/Layout" } satisfies Meta;
export default meta;

export function Corners(): ReactElement {
  return (
    <div className="flex flex-wrap gap-6">
      <div className="grid size-28 place-items-center rounded-sm border bg-card text-sm">Small</div>
      <div className="grid size-28 place-items-center rounded-md border bg-card text-sm">
        Medium
      </div>
      <div className="grid size-28 place-items-center rounded-lg border bg-card text-sm">Large</div>
      <div className="grid size-28 place-items-center rounded-xl border bg-card text-sm">
        Extra large
      </div>
    </div>
  );
}

export function Spacing(): ReactElement {
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Spacing scale</h1>
      <p className="text-sm text-muted-foreground">
        Use the shared Tailwind spacing scale for consistent layouts.
      </p>
      <div className="flex items-center gap-4">
        <code className="w-16 text-xs">space-1</code>
        <div className="h-4 w-1 bg-red-800" />
      </div>
      <div className="flex items-center gap-4">
        <code className="w-16 text-xs">space-2</code>
        <div className="h-4 w-2 bg-red-800" />
      </div>
      <div className="flex items-center gap-4">
        <code className="w-16 text-xs">space-4</code>
        <div className="h-4 w-4 bg-red-800" />
      </div>
      <div className="flex items-center gap-4">
        <code className="w-16 text-xs">space-6</code>
        <div className="h-4 w-6 bg-red-800" />
      </div>
      <div className="flex items-center gap-4">
        <code className="w-16 text-xs">space-8</code>
        <div className="h-4 w-8 bg-red-800" />
      </div>
    </div>
  );
}
