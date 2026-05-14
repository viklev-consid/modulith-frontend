# Modulith Frontend

Frontend application for [Modulith](https://github.com/viklev-consid/modulith), an opinionated .NET modular monolith template for building RESTful APIs with clear module boundaries, OpenAPI contracts, authentication, notifications, scheduled jobs, and agent-ready development workflows.

This repository provides the Next.js user interface layer for that backend. It is intentionally API-contract driven: the backend owns the OpenAPI document, and this app generates typed clients, schemas, SDK helpers, and TanStack Query bindings from that contract.

## Stack

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui (style `base-lyra`) from `components/ui` for component primitives
- TanStack Query, Table, and Form
- nuqs for URL-synced state (pagination, filters)
- Hey API OpenAPI code generation
- Vitest, Testing Library, jsdom, and MSW

## Prerequisites

- Node.js and pnpm
- The Modulith backend when syncing the OpenAPI contract or developing against live API endpoints

The frontend expects the backend OpenAPI document to be available at:

```text
http://localhost:5000/openapi/v1.json
```

In the backend repository, the full stack is run through .NET Aspire:

```bash
dotnet run --project src/AppHost
```

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Contract Workflow

The backend is the source of truth for API shape. To refresh the frontend contract:

```bash
pnpm api:sync
pnpm api:generate
```

`pnpm api:sync` downloads the backend OpenAPI document into `openapi.json`.

`pnpm api:generate` reads `openapi.json` and writes generated code to `api/generated` using `hey-api.config.ts`.

Do not hand-edit generated API files. Change the backend contract, sync `openapi.json`, then regenerate.

## Scripts

```bash
pnpm dev            # Start Next.js with Turbopack
pnpm build          # Build for production
pnpm start          # Start the production server
pnpm lint           # Run ESLint
pnpm format         # Format TypeScript and TSX files
pnpm typecheck      # Run TypeScript without emitting files
pnpm test           # Run Vitest once
pnpm test:watch     # Run Vitest in watch mode
pnpm test:coverage  # Run Vitest with coverage
pnpm api:sync       # Fetch openapi.json from the backend
pnpm api:generate   # Generate API clients and schemas
```

## Project Layout

```text
app/                 Next.js App Router routes, layout, and global styles
components/ui/       shadcn/ui components
components/          Shared application components
hooks/               Shared React hooks
lib/                 Shared utilities
tests/               Test setup and MSW mocks
api/generated/       Generated API client output
openapi.json         Synced backend OpenAPI contract
```

## Development Conventions

- Use `pnpm` for package and script commands.
- Prefer App Router patterns in `app/`.
- Import local modules through the `@/*` alias.
- Reuse components from `components/ui` before adding new primitives.
- Use `lucide-react` for icons.
- Use `cn` from `@/lib/utils` for class merging.
- Keep tests as `*.test.ts` or `*.test.tsx`.
- Prefer MSW-backed tests for API behavior instead of calling live services in unit tests.

Before opening a change, run the narrowest checks that match the work:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Run `pnpm build` for changes that affect routing, server/client boundaries, generated API usage, or production behavior.

## Backend Relationship

The paired backend provides the platform capabilities this frontend is expected to consume:

- JWT authentication and refresh-token rotation
- Role-based access control and permission claims
- User registration, login, password reset, and account flows
- Product-facing bell notifications and SSE updates
- OpenAPI documentation through Scalar
- Per-module health checks and observability
- Scheduled jobs, transactional messaging, and audit history

See the [backend README](https://github.com/viklev-consid/modulith/blob/main/README.md) for architecture, module boundaries, backend setup, and platform feature details.
