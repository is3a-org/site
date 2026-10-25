# IS3A design system

IS3A-owned React components built directly on `@base-ui/react`. Base UI supplies keyboard
navigation, focus management, accessible states, and overlay positioning. This package owns the
markup composition, visual tokens, sizing, and component APIs. The website and Storybook consume the
same source.

## Commands

From the workspace root:

```bash
vp run storybook
vp run storybook:build
vp run @is3a/design-system#types:check
vp test run --project design-system
```

The web app consumes source directly; it does not depend on the static Storybook output.

## Composition

Import components from their package subpaths:

```tsx
import { Button } from "@is3a/design-system/button";
import { Dialog, DialogTrigger } from "@is3a/design-system/dialog";

<Dialog>
  <DialogTrigger render={<Button />}>Edit membership</DialogTrigger>
</Dialog>

// IS3A non-native buttons retain navigation-link semantics.
<Button render={<Link to="/dashboard" />} nativeButton={false}>
  Dashboard
</Button>
```

Use Base UI's `render` prop to compose elements without extra DOM wrappers. Custom render targets
must forward their ref and incoming props. State selectors follow Base UI's attributes, such as
`data-checked`, `data-active`, `data-open`, and `data-popup-open`.

Select roots expose Base UI's nullable value callback. Supply `items` with labels so selected text
is available before the popup mounts, including during server rendering:

```tsx
<Select
  value={plan}
  items={{ full: "Full membership", flex: "Flex membership" }}
  onValueChange={(value) => {
    if (value !== null) setPlan(value);
  }}
>
  {/* Trigger, value, and popup items */}
</Select>
```

Checkboxes use boolean `checked` plus a separate `indeterminate` prop. Tooltip providers use
`delay`. Sliders accept arrays, including ranges, with `onValueChange` and `onValueCommitted`.

Native semantic elements handle cards, tables, labels, breadcrumbs, and textareas. DayPicker
provides the calendar because Base UI does not currently provide one. Application-specific JSON
Forms renderers live in `apps/web/app/components/forms/` and use this package's controls.

## Visual language: bracket and cross

Every pattern comes from the logo, a code bracket around Amsterdam's three St. Andrew's crosses. See
Storybook's Foundations/Brand page.

- **The bracket marks what is current.** The `bracket` utility draws ink `[ ]` around the current
  page (`aria-current="page"` or `data-active`), the selected tab (the bracket slides between tabs),
  and today's date. Only one item in a group carries it. Don't use it for decoration or hover.
- **The crosses wait and divide.** `CrossesLoader` is the loading state, and `CrossesDivider` breaks
  major sections. Never use a cross to mean close or remove.
- **Type:** Archivo throughout. `font-display` condenses it to 72% width, echoing the logo's tall
  letters, for titles, buttons, tabs, table headings, and badges. Body text stays at normal width.
  Public page titles go bold and uppercase, like the logo's IS3A.
- **Color:** Amsterdam red `#bd1900` for brand and primary actions; ink (black, white in dark mode)
  for brackets, crosses, focus, and table rules; klinker grey for hover and muted surfaces; gracht
  green (`success`) for positive states. Red is the brand, so the destructive button is outlined
  until hovered, and positive statuses are never red.
- **Callouts:** `Alert` (default, `success`, `warning`, `destructive`) replaces hand-made colored
  boxes. Add `role="alert"` when it appears in response to an action.
- **Shape:** 2px control and 4px surface corners. Outline buttons, checkbox and radio borders, and
  focus outlines share the bracket's 2px stroke. Keyboard focus is a square ink outline.
- Minimum 40px button/input height, explicit disabled/invalid states, `scale(0.96)` button press.
- Short, interruptible overlay transitions; motion is disabled under reduced motion.
- Semantic light/dark tokens; no separate component theme implementation.

```css
@import "tailwindcss";
@import "@is3a/design-system/theme.css";
```

The theme registers all shared utility sources, including `control-styles.ts`. Consumers load font
files themselves. Add `dark` to the document element to switch themes; the web app does this from a
stored system/light/dark choice before first paint. The app content root uses `isolation: isolate`,
while portals render outside it. The body is positioned relatively so absolute modal backdrops cover
the visual viewport on mobile Safari.

## Adding components

1. Choose a Base UI primitive when behavior or accessibility requires one; otherwise use HTML.
2. Assemble and style it here using the semantic theme and shared interaction styles.
3. Keep app imports out of the package.
4. Add colocated stories for normal, disabled, invalid, and selected states as applicable.
5. Test keyboard interaction, focus restoration, composition, and native form behavior.
6. Run type checks, lint, tests, and both production builds.

Base UI props preserve library-owned refs, events, and render callbacks rather than recursively
freezing those capabilities. The lint policy allows those upstream types explicitly.
