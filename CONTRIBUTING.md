# Contributing to Ktavi

## Development setup

```bash
git clone https://github.com/mayashavin/polira.git
cd polira
npm install
cp .env.example .env
# Add your OPENAI_API_KEY to .env
```

## Commands

```bash
npm run dev -- <command> <args>   # Run CLI locally via tsx
npm run build                     # Build with Vite
npm test                          # Run tests
npm run test:watch                # Watch mode
npm run typecheck                 # Type check (tsc --noEmit)
npm run lint                      # Lint (eslint)
npm run format                    # Format (prettier)
```

Example:

```bash
npm run dev -- analyze tests/fixtures/valid-post.md
npm run dev -- seo tests/fixtures/missing-meta.md
```

## Architecture

Four-layer architecture -- each layer only calls the layer below it:

```
CLI Commands  ->  parse args, load config, call workflows, print output
Workflows     ->  compose tools into product flows
Tools         ->  atomic capabilities (parse, review, generate, etc.)
Providers     ->  adapters for external systems (OpenAI, Cloudinary, local fs)
```

### Source layout

```
src/cli/commands/     CLI command definitions
src/cli/shared/       Shared CLI helpers (e.g. provider factory)
src/core/             Types, config, provider interfaces, errors, schemas
src/tools/            Each tool in its own directory
src/workflows/        Workflow compositions
src/providers/        AI, image, and storage provider implementations
src/utils/            Filesystem, frontmatter, markdown, slug, reading-time helpers
tests/fixtures/       Markdown test files
tests/tools/          Tool unit tests
tests/workflows/      Workflow integration tests
tests/helpers/        Mock provider factories (comprehensive)
tests/shared/         Mock provider factories (simplified)
```

### Adding a new tool

1. Create a directory under `src/tools/your-tool/`
2. Add `index.ts` (re-export), `yourTool.ts` (implementation), and optionally `prompts.ts` (AI prompts)
3. Tool function signature: `(input, provider?) => Promise<Output>`
4. If calling AI, validate the response with a zod schema from `src/core/schemas.ts`
5. Add the type to `src/core/types.ts` if it introduces new domain types
6. Write tests in `tests/tools/` using mock providers from `tests/helpers/mockProviders.ts`

### Adding a new workflow

1. Create a file in `src/workflows/`
2. Compose existing tools -- workflows don't call providers directly
3. Accept providers as optional parameters for graceful degradation
4. Define input options type and result type in the same file
5. Write integration tests in `tests/workflows/` with mocked providers

### Adding a new CLI command

1. Create a file in `src/cli/commands/`
2. Register it in `src/cli/index.ts`
3. Create providers in the command handler, pass them to the workflow
4. Commands handle CLI parsing and output formatting only -- no business logic

## Testing

Tests use Vitest. External providers (OpenAI, Cloudinary) are always mocked -- tests never make real API calls.

```bash
npm test                                    # Run all tests
npx vitest run tests/tools/myTool.test.ts   # Run a single test file
npm run test:watch                          # Watch mode
```

### Mock providers

Two sets of mock factories are available:

- `tests/helpers/mockProviders.ts` -- comprehensive mocks with canned responses keyed by schema name
- `tests/shared/` -- simplified mocks that take a single response object

Use `tests/helpers/` for workflow integration tests that need realistic multi-tool responses. Use `tests/shared/` for focused tool unit tests.

## Pull requests

- Keep PRs focused on a single change
- Add tests for new tools and workflows
- Run `npm run typecheck && npm test && npm run lint` before submitting
- Add a changeset for user-facing changes: `npx changeset`

## Code style

- TypeScript with ES modules (`"type": "module"`)
- No comments unless the "why" is non-obvious
- Validate AI output with zod schemas
- Default to dry-run mode -- never write files unless `--apply` is passed
- Use provider abstractions -- don't hard-code OpenAI or Cloudinary in tools or workflows
