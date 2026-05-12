<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Project conventions

- Use `pnpm` for all package and script commands.
- Prefer App Router patterns in the root `app/` directory.
- Use the `@/*` path alias, which maps to the repository root.
- Reuse existing shadcn/ui components from `components/ui` before adding new primitives.
- Use `lucide-react` for icons.
- Use `cn` from `@/lib/utils` for class merging.
- For API client/types changes, do not hand-edit generated files in `api/generated`; update `openapi.json` and run `pnpm api:generate`.
- Validate meaningful changes with the narrowest relevant checks:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build` for Next.js routing, server/client boundary, or production behavior changes.
- Keep tests as `*.test.ts` or `*.test.tsx`; Vitest runs in jsdom with setup from `tests/setup.ts`.

# UI conventions

- This app uses Tailwind CSS v4 and shadcn style `base-lyra`; match the existing component style and token usage.
- Avoid adding new design systems or one-off component libraries unless explicitly requested.

# Generated/API workflow

- `pnpm api:sync` expects the backend OpenAPI endpoint at `http://localhost:5000/openapi/v1.json`.
- If the backend is unavailable, explain that API sync could not be verified instead of fabricating generated output.
