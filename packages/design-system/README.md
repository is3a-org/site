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

## Visual language

- White and charcoal surfaces, with IS3A logo red (`#bd1900`) for primary actions and selection.
- Inter for application UI; PT Sans and Merriweather remain available for the public site.
- Compact 8px surface corners, smaller control corners, structural borders, and overlay shadows.
- Minimum 40px button/input height, visible focus rings, explicit disabled/invalid states.
- Short, interruptible overlay transitions, disabled under reduced motion.
- Semantic light/dark tokens; no separate component theme implementation.

```css
@import "tailwindcss";
@import "@is3a/design-system/theme.css";
```

The theme registers all shared utility sources, including `control-styles.ts`. Consumers load font
files themselves. Add `dark` to the document element to switch themes. The app content root uses
`isolation: isolate`, while portals render outside it. The body is positioned relatively so absolute
modal backdrops cover the visual viewport on mobile Safari.

## Adding components

1. Choose a Base UI primitive when behavior or accessibility requires one; otherwise use HTML.
2. Assemble and style it here using the semantic theme and shared interaction styles.
3. Keep app imports out of the package.
4. Add colocated stories for normal, disabled, invalid, and selected states as applicable.
5. Test keyboard interaction, focus restoration, composition, and native form behavior.
6. Run type checks, lint, tests, and both production builds.

Base UI props preserve library-owned refs, events, and render callbacks rather than recursively
freezing those capabilities. The lint policy allows those upstream types explicitly.
