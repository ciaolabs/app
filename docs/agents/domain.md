# Domain docs

Single-context layout. Skills that need project context should read:

1. `CONTEXT.md` at the repo root — domain language, architecture overview, key concepts
2. `docs/adr/` — Architecture Decision Records (create this directory when the first ADR is written)

## Notes for skills

- If `CONTEXT.md` does not exist yet, do not error — prompt the user to create it or generate a draft based on the codebase.
- ADRs are optional. If `docs/adr/` is empty or absent, skip it silently.
