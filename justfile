frontend-check:
  cd frontend && bun run check
  cd frontend && bun run tsc -b
  cd frontend && bun run vitest run
