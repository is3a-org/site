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
vp check            # Formatting and type checks; lint findings are warnings
vp run check        # Build dependencies/generate types, then run all static checks
vp run ready        # Full validation: static checks, tests, and production build
vp lint             # Lint codebase with Oxlint
vp fmt              # Format code with Oxfmt (including Tailwind class sorting)
vp run test         # Build the library and run its tests
vp test run         # Run all configured test projects directly
```

## Development

Use `vp run build` and `vp run dev`, not the built-in `vp build` and `vp dev`: the web app needs
React Router's framework CLI, and the workspace library must be built first. Package-level tasks can
also be run directly, e.g. `vp run @is3a/web#build` or `vp run @is3a/web#preview`.

- **Monorepo**: pnpm workspaces with Vite+ task dependencies and local build/test caching
- **Code Quality**: `vp install` sets up a staged-files-only hook (`vp staged` → `vp fmt`, then
  `vp check`). Formatting is automatic; advisory lint does not rewrite application code. Builds and
  tests are explicit via `vp run ready`, not part of pre-commit. Inspect with `vp hooks status`.
- **Linting**: Uses the TypeScript/Unicorn rules and vendored `anti-slop` plugin from
  `brand-intelligence`, with rule violations reported as warnings while the backlog is addressed.
  Formatting and compiler errors still block checks and commits; type-aware linting remains enabled.
- **Dependency patch**: `patches/@fragno-dev__unplugin-fragno@0.0.8.patch` corrects the Rollup
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
