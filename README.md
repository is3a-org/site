# IS3A

TypeScript monorepo for IS3A

## Tooling

- Task/build management: [turborepo](https://turborepo.com/) configured in
  [turbo.json](./turbo.json)
- Pre-commit hooks: [Lefthook](https://lefthook.dev/) which are configured in
  [lefthook.yaml](./lefthook.yaml)
- Deployment: Cloudflare (see wrangler.jsonc files for details)
- CI/CD: Github Actions, see [workflows here](.github/workflows)

## Prerequisites

- **Node.js**: https://nodejs.org/en/download
- **pnpm**: https://pnpm.io/installation

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

## Available Commands

```bash
pnpm dev            # Start development servers
pnpm build          # Build all packages and apps
pnpm types:check    # Type-check all packages
pnpm lint           # Lint codebase with Oxlint
pnpm format         # Format code with Prettier
pnpm test           # Run tests
```

## Development

- **Monorepo**: Uses Turborepo for task orchestration and pnpm workspaces
- **Code Quality**: Pre-commit hooks (Lefthook) auto-format and lint staged files
- **TypeScript**: Strict mode enabled across all packages

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
