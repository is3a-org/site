import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

const meta = { title: "Foundations/Palette" } satisfies Meta;
export default meta;

interface ThemeToken {
  readonly name: string;
  readonly label: string;
}

const tokens: readonly ThemeToken[] = [
  { name: "background", label: "Page background" },
  { name: "foreground", label: "Primary text" },
  { name: "card", label: "Card background" },
  { name: "popover", label: "Overlay background" },
  { name: "primary", label: "Primary actions" },
  { name: "secondary", label: "Secondary actions" },
  { name: "muted", label: "Muted surface" },
  { name: "muted-foreground", label: "Secondary text" },
  { name: "accent", label: "Hover and selection" },
  { name: "destructive", label: "Errors and destructive actions" },
  { name: "border", label: "Borders and separators" },
  { name: "ring", label: "Keyboard focus" },
  { name: "sidebar", label: "Navigation background" },
];

export function SemanticColors(): ReactElement {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-2xl font-semibold">IS3A color tokens</h1>
        <p className="text-sm text-muted-foreground">
          Shared by the website and component library. Use the theme toolbar to inspect light and
          dark modes. Each swatch reads the actual CSS variable, not a copied value.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tokens.map(({ name, label }) => (
          <div key={name} className="overflow-hidden rounded-lg border">
            <div className="h-20 border-b" style={{ backgroundColor: `var(--${name})` }} />
            <div className="space-y-1 p-3">
              <p className="text-sm font-medium">{label}</p>
              <code className="text-xs text-muted-foreground">--{name}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrandRed(): ReactElement {
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold">IS3A red</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        The existing red scale is preserved. Red 800 (#bd1900) is the logo color; neutral semantic
        tokens remain the default for dashboard controls.
      </p>
      <div className="flex overflow-hidden rounded-lg border">
        <div className="h-24 flex-1 bg-red-50" aria-label="Red 50" />
        <div className="h-24 flex-1 bg-red-100" aria-label="Red 100" />
        <div className="h-24 flex-1 bg-red-200" aria-label="Red 200" />
        <div className="h-24 flex-1 bg-red-300" aria-label="Red 300" />
        <div className="h-24 flex-1 bg-red-400" aria-label="Red 400" />
        <div className="h-24 flex-1 bg-red-500" aria-label="Red 500" />
        <div className="h-24 flex-1 bg-red-600" aria-label="Red 600" />
        <div className="h-24 flex-1 bg-red-700" aria-label="Red 700" />
        <div className="h-24 flex-1 bg-red-800" aria-label="Red 800" />
        <div className="h-24 flex-1 bg-red-900" aria-label="Red 900" />
        <div className="h-24 flex-1 bg-red-950" aria-label="Red 950" />
      </div>
    </div>
  );
}
