# Codebase Architecture Guide for Claude

## Project Overview

This is a **modern TypeScript monorepo** utilizing **Turborepo** for task management and **pnpm** as
the package manager.

### Key Facts

- **Project Type**: Full-stack web application monorepo
- **Build System**: Turbo (monorepo orchestration)
- **Package Manager**: pnpm 10.0.0 (with workspace support)
- **Deployment Target**: Cloudflare

---

## Project Structure

```
site/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── app/                # Next.js App Router directory
│       ├── next.config.js
│       └── package.json
│
├── packages/
│   ├── ui/                     # React component library
│   │   ├── src/                # Reusable UI components (Button, Card, Code)
│   │   └── package.json
│   │
│   └── typescript-config/      # Shared TypeScript configurations
│       ├── base.json           # Base TS config (ES2022, strict mode)
│       ├── nextjs.json         # Next.js specific config
│       ├── react-library.json  # React library config
│       └── package.json
│
├── turbo.json                  # Turbo monorepo configuration
├── pnpm-workspace.yaml         # pnpm workspace definition
├── package.json                # Root workspace package.json
├── prettier.config.mjs         # Code formatting rules
├── .oxlintrc.json             # Linter configuration (Oxlint)
├── lefthook.yml               # Pre-commit hooks
└── .github/
    └── workflows/
        └── ci.yml             # GitHub Actions CI pipeline
```

---

## Core Architecture Patterns

### 1. Monorepo Strategy (pnpm workspaces + Turbo)

**Purpose**: Enable code sharing across applications while maintaining separate build outputs.

- **Workspace Definition**: `pnpm-workspace.yaml` declares `apps/*` and `packages/*`
- **Package References**: Using `workspace:*` protocol in package.json for internal dependencies
  - Example: `@repo/ui` and `@repo/typescript-config` are referenced as `workspace:*`
- **Turbo Caching**: Configured in `turbo.json` to cache build outputs and skip redundant operations

### 2. Build Task Dependencies (Turbo)

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"], // Wait for dependencies to build first
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "types:check": {
      "dependsOn": ["^types:check"] // Recursive type checking
    },
    "test": {
      "dependsOn": ["build"] // Tests run after builds
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Key Pattern**: `^` prefix indicates "run in dependencies first" (topological ordering)

### 3. Shared TypeScript Configuration

**Location**: `packages/typescript-config/`

Three configuration profiles:

- **base.json**: Strict mode, ES2022, NodeNext modules (foundation for all)
- **react-library.json**: Extends base + React JSX output

### 4. Code Quality Standards

**Linting**: Oxlint (.oxlintrc.json)

- TypeScript plugin + Unicorn plugin
- Strict error rules (no `any`, no class assignment, proper async patterns)
- Ignores build outputs (.next, .turbo, dist, node_modules)

**Formatting**: Prettier

- Single line width: 100 characters
- Tailwind CSS plugin for class sorting
- Semi-colons required
- Double quotes preferred
- Trailing commas on all multi-line structures

**Pre-commit Hooks**: Lefthook (lefthook.yml)

- Prettier format check + auto-fix on staged files
- Oxlint auto-fix on staged files
- Turbo build + type-check + test (parallel, triggered on TS files)

### 5. CI/CD Pipeline

**GitHub Actions** (.github/workflows/ci.yml):

- **Lint Job**: Prettier format check + Oxlint
- **Build Job**: Type checking + Next.js build
- **Test Job**: Test runner (currently stubbed as "no tests")
- **Secrets Integration**: TURBO_TOKEN and TURBO_TEAM for remote caching

## **Deployment**: Cloudflare integration via wrangler.jsonc files

## Key Dependencies & Technologies

### Development

- **turbo**: 2.5.8 (monorepo orchestrator)
- **typescript**: 5.9.2 (strict type checking)
- **oxlint**: 1.24.0 (fast, zero-config linter)
- **prettier**: 3.6.2 (code formatter)
- **wrangler**: 4.44.0 (Cloudflare CLI)
- **lefthook**: 2.0.0 (Git hooks)

### Workspace Scripts

**Root-level commands** (aggregate across monorepo):

```bash
pnpm build          # Turbo: build all packages/apps
pnpm dev            # Turbo: start dev servers
pnpm format         # Prettier: format entire repo
pnpm types:check    # Turbo: type-check all packages
pnpm lint           # Oxlint: lint entire codebase
pnpm test           # Turbo: run all tests
```

---

## Development Workflow

### Local Setup

```bash
pnpm install                    # Install dependencies
pnpm dev                        # Start dev servers
pnpm format                     # Auto-format code
pnpm lint                       # Check linting
```

### Pre-commit Automation

Lefthook runs on every commit:

1. Prettier checks + auto-fixes staged files
2. Oxlint auto-fixes staged files
3. Turbo builds/type-checks/tests (if .ts/.tsx changed)

### Type Safety

- Strict TypeScript mode enforced globally
- `types:check` task in Turbo validates all packages
- `@types/*` packages included for Node, React, React-DOM

---

## Architectural Conventions

### 1. Workspace Import Aliases

- Internal packages use `@repo/` prefix (e.g., `@repo/ui`, `@repo/typescript-config`)
- Configured via `workspace:*` protocol in pnpm

### 2. Dependency Direction

- `apps/web` depends on `packages/ui` and `packages/typescript-config`
- `packages/ui` depends on `packages/typescript-config` (for dev)
- No circular dependencies by design

### 3. TypeScript Strictness

All packages enforce:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- No implicit `any`
- Proper null/undefined checks

### 4. Component Naming

- React components: PascalCase files (e.g., `Button.tsx`)
- Exported as named exports or default

### 5. Formatting Standards

- 100 character line width (balanced for readability + screen real estate)
- Tailwind class sorting in JSX
- No semicolon debates (always required)

---

## Git History & Recent Changes

Current branch: `main`

---

## CI/CD & Automation

**GitHub Actions** triggers on:

- Push to `main` branch
- Pull requests targeting `main`

**Jobs run in parallel**:

1. Lint (Prettier + Oxlint)
2. Build (Type-check + Next.js build)
3. Test (Currently stubbed)

**Caching**: Turbo remote cache via secrets (TURBO_TOKEN, TURBO_TEAM)
