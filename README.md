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
vp run build        # Build the library, then the web app
vp run build:watch  # Rebuild the library on changes (use a second terminal)
vp run types:check  # Generate Worker/route types and type-check all packages
vp check            # Check formatting and lint without requiring generated types
vp run check        # Formatting, lint, and framework-aware type checks
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
- **Code Quality**: `vp install` sets up hooks. They format/lint staged files and, for TypeScript
  changes, run builds, type checks, and tests. Inspect with `vp hooks status`.
- **TypeScript**: Strict mode enabled across all packages; `vp run types:check` retains `tsc` and
  the framework's code generation rather than checking incomplete generated types in `vp check`.
- **Configuration**: Shared lint/format rules live in the root `vite.config.ts`; the library's
  `pack` configuration preserves its browser/server exports and Fragno code splitting.

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
├── apps/               # Deployable apps
└── packages/           # Resuable packages
    └── typescript-config/  # TypeScript configs
```
