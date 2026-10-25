# IS3A

TypeScript monorepo for IS3A

## Tooling

- Toolchain: [Vite+](https://viteplus.dev/) for workspace tasks, Vite, Vitest, Oxlint, Oxfmt, and
  library packaging, configured in the root and package-level `vite.config.ts` files
- Pre-commit hooks: Vite+ staged checks and [.vite-hooks/pre-commit](./.vite-hooks/pre-commit)
- Deployment: Cloudflare (see wrangler.jsonc files for details)
- CI/CD: Github Actions, see [workflows here](.github/workflows)

## Prerequisites

- **Vite+ CLI**: follow the [installation guide](https://viteplus.dev/guide/)
- Vite+ manages the Node.js version in `.node-version` and pnpm version in `package.json`.
- **Git 2.32+** for staged-file checks

## Quick Start

```bash
# Install dependencies
vp install

# Start dev server (builds workspace dependencies first)
vp run dev

# Build for production
vp run build
```

## Available Commands

```bash
vp run dev          # Start the React Router development server
vp run build        # Build the library, web app, and static Storybook
vp run storybook    # Start the component workshop on port 6006
vp run storybook:build # Build just the static Storybook
vp run build:watch  # Rebuild the library on changes (use a second terminal)
vp run types:check  # Generate Worker/route types and type-check all packages
vp check            # Check formatting, lint policy, and types
vp run check        # Build dependencies/generate types, then run all static checks
vp run ready        # Full validation: static checks, tests, and production build
vp run lint         # Enforce the full lint policy with zero warnings allowed
vp fmt              # Format code with Oxfmt (including Tailwind class sorting)
vp run test         # Run package, app, tooling, lint-policy, and Stripe guardrail tests
vp test run         # Run all configured test projects directly
vp run stripe -- version # Run the repo-local, sandbox-only Stripe CLI
vp run stripe:webhook # Forward sandbox webhooks to the development server
```

## Development

Use `vp run build` and `vp run dev`, not the built-in `vp build` and `vp dev`: the web app needs
React Router's framework CLI, and the workspace library must be built first. Package-level tasks can
also be run directly, e.g. `vp run @is3a/web#build` or `vp run @is3a/web#preview`.

- **Monorepo**: pnpm workspaces with Vite+ task dependencies and local build/test caching
- **Code Quality**: `vp install` sets up a staged-files-only hook (`vp staged` → `vp fmt`, then
  `vp check`). Formatting is automatic; lint and compiler findings block the check. Builds and tests
  run through `vp run ready`. Inspect the staged hook with `vp hooks status`.
- **Linting**: Uses the TypeScript/Unicorn rules and vendored `anti-slop` plugin from
  `brand-intelligence`, plus React/hooks, accessibility, imports, promises, and Vitest checks. All
  selected rules are errors, with type-aware linting and a zero-warning limit. The same policy
  covers application code, packages, tests, and maintained tooling; only generated output and
  dependencies are excluded. Framework-owned mutable capabilities have explicit type-owner
  allowances. Required JSON/database nulls and established framework APIs have exact-line
  `COMPATIBILITY` explanations and regression tests. The lint-policy tests audit those exceptions
  and verify real violations fail.
- **Dependency patch**: `patches/@fragno-dev__unplugin-fragno@0.0.9.patch` corrects the Rollup
  integration’s declaration export to the file actually shipped in that release. This keeps native
  type checking enabled without suppressing the missing declaration error.
- **Formatting**: Imports, package manifests, and Tailwind classes are sorted. Workspace imports use
  the `@is3a/*` group; Tailwind uses the design system’s Storybook entry and recognizes `cn()`.
- **TypeScript**: Run `vp run types:check` after a fresh install to build dependencies and generate
  Worker/route types before direct `vp check` or staged checks. `vp run check` and CI do this
  automatically.
- **Editor**: Install the recommended Vite+ extension pack in VS Code for Oxc formatting and fixes
  on save. Root lint/format settings apply across workspace packages.
- **Configuration**: Shared lint/format rules live in the root `vite.config.ts`; the library's
  `pack` configuration preserves its browser/server exports and Fragno code splitting.

### Local Stripe sandbox

The official `@stripe/cli` is installed as a web-app dev dependency by `vp install`; no global
installation or `stripe login` is needed. Put a sandbox `STRIPE_SECRET_KEY` in `apps/web/.env`,
alongside the sandbox `VITE_STRIPE_PRICE_ID_FULL` and `VITE_STRIPE_PRICE_ID_FLEX` price IDs.

```bash
# Terminal 1: start the app on the default development port, 5173
vp run dev

# Terminal 2: forward Stripe sandbox events to /api/stripe/webhook
vp run stripe:webhook

# Or target a preview/server running on a different port
vp run stripe:webhook -- --forward-to http://localhost:4174/api/stripe/webhook
```

The webhook command requests snapshot events, as required by the installed Fragno integration. The
repo wrapper passes the API key through the child process environment, rejects live keys and
`--live`/`--api-key` overrides, and saves the listener's signing secret directly to `apps/web/.env`
as `STRIPE_WEBHOOK_SECRET` without printing it. Restart the app after the listener saves a new
secret. If using a built preview, rebuild after changing either `VITE_` price ID. Keep the listener
running while testing. Local runtime files under `.stripe/` are ignored by Git.

Other CLI commands are available with `vp run stripe -- <command>`, for example
`vp run stripe -- listen --help`. Commands such as `trigger` and API writes can create sandbox
records; do not use them against existing customer or subscription data without reviewing their
effects. This local listener secret is not a production webhook secret.

### Design system and Storybook

Shared UI lives in `packages/design-system`, following the same package layout as
`brand-intelligence`. It exports React components directly from source, a shared `cn()` utility, and
the existing IS3A theme. The app and Storybook use the same components and tokens.

```tsx
import { Button } from "@is3a/design-system/button";
import { cn } from "@is3a/design-system/cn";
```

Run `vp run storybook` for the component workshop, or `vp run storybook --port 6016` if 6006 is
already in use. The stories cover all 26 UI primitives, component states, and color, typography,
spacing, and radius foundations. Use the theme toolbar to switch between light and dark.

`vp run storybook:build` writes `packages/design-system/storybook-static/`. This is also part of the
root build and CI; it is not deployed with the Cloudflare Worker. Application development does not
need a Storybook build because the design system exports source.

See [the design system README](packages/design-system/README.md) for component and theme
conventions.

### Give your user the admin role

```sql
UPDATE "user_simple-auth-db"
 SET role = 'admin'
 WHERE email = 'your@email.com';
```

## Deployment

Pushing to `main` deploys `apps/web` as the `site` Cloudflare Worker (IS3A account, served at
`new.is3a.nl`) once lint, build, and test pass. See the `deploy` job in
[ci.yml](.github/workflows/ci.yml): build, run Drizzle migrations, `wrangler deploy`.

- **Database**: [Neon](https://neon.tech) Postgres. The `IS3A_D1` binding is unused.
- **Migrations** run before the new Worker goes live, so keep them compatible with the old code.
- **Stripe** runs in the `StripeFragmentDurableObject` Durable Object, which processes webhook
  events with Fragno durable hooks. Route Stripe fragment requests and writes through
  `getStripeFragment()`.
- **Secrets** live in two places; keep both `PG_DATABASE_URL`s pointing at the same database:
  - GitHub Actions: `PG_DATABASE_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
  - Worker (`wrangler secret put`): `PG_DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
    `POSTMARK_SERVER_API_TOKEN`, `CF_TURNSTILE_SECRET_KEY`
- **Public `VITE_*` vars** are baked in at build time and set in `ci.yml`.

## Project Structure

```
/
├── apps/
│   └── web/                         # React Router + Cloudflare application
├── packages/
│   ├── design-system/               # Shared theme, UI components, and Storybook
│   └── one-time-password-fragment/  # Authentication fragment
└── tooling/                         # Shared lint plugins
```
