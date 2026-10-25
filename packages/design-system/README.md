# IS3A design system

Shared React components and theme tokens for the IS3A website. The package structure follows
`brand-intelligence`, while preserving this application's Radix/shadcn components, APIs, and visual
identity. There is one implementation of each component, used by both the app and Storybook.

## Commands

From the workspace root:

```bash
vp run storybook                         # Workshop on port 6006
vp run storybook --port 6016             # Override the port
vp run storybook:build                   # Static output in storybook-static/
vp run @is3a/design-system#types:check    # Check components, stories, and Storybook config
```

The root `vp run build` includes the static Storybook build. The web app consumes source directly,
so it does not need the Storybook output to build or run. Generated output is ignored by Git,
formatting, and linting. Storybook telemetry is disabled.

## Using components

```tsx
import { Button } from "@is3a/design-system/button";
import { Card, CardContent } from "@is3a/design-system/card";
import { cn } from "@is3a/design-system/cn";
```

Each file in `src/components/` is a public component subpath. Shared hooks live under `src/hooks/`.
Keep imports within the package relative; do not import app routes, app utilities, or app aliases.

The web app retains a compatibility alias from `@/components/ui/*` to this package for
`@fragno-dev/jsonforms-shadcn-renderers`. Application code should use the package imports directly.
The app's `cn` export is a compatibility re-export of this package's utility.

The app and package `components.json` files point shared shadcn components and utilities here rather
than creating a second copy under the app.

## Theme

In a consumer's Tailwind entry:

```css
@import "tailwindcss";
@import "@is3a/design-system/theme.css";
```

The theme registers its component sources with Tailwind, includes animation utilities, and owns:

- Semantic surface, text, action, border, focus, chart, and sidebar tokens.
- The existing IS3A red scale (logo color: red 800, `#bd1900`).
- Inter, PT Sans, and Merriweather font stacks.
- Shared radii and light/dark variables.

The theme declares font stacks; consumers load the font files. Storybook's
`.storybook/preview-head.html` matches the web app's existing Google Fonts links, with system
fallbacks if those fonts are unavailable.

Use semantic utilities such as `bg-background`, `text-muted-foreground`, and `border-border`. Use
the brand red scale for existing public-site treatments rather than replacing the dashboard's
neutral action tokens. Add a `dark` class to the document element for dark mode. Storybook's theme
toolbar does this at the document level so dialogs, menus, and other portaled content inherit it.

## Stories

Stories sit beside their components as `*.stories.tsx`. Foundations live directly under `src/`. The
workshop covers every shared primitive, plus selected, disabled, validation, and empty states.
Overlays and controls are interactive; they do not call application APIs.

When adding or changing a component:

1. Keep the component independent of the app and preserve accessible names and keyboard behavior.
2. Add or update its colocated stories, including important states.
3. Check both themes and narrow viewports, including portaled content where relevant.
4. Run formatting, type checks, and the static Storybook build.

The workspace lint policy is enforced as errors for components, stories, and tests. React and DOM
capabilities retain their owner types when deep readonly conversion would break ref forwarding.
Exact-line compatibility exceptions preserve the public grouping, tooltip, updater, and cookie
contracts; colocated tests cover them. Run `vp run test` alongside the checks above.
