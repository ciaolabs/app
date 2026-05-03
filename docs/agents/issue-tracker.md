# Issue tracker: local markdown

Issues live as markdown files under `.scratch/` in this repo. This directory is gitignored — issues are private to your local machine.

## Layout

```
.scratch/
  <slug>/
    issue.md      # the issue itself
    notes.md      # optional scratch notes
```

## Creating an issue

Create a directory named after a short slug, e.g. `.scratch/fix-chat-500/`. Write the issue in `issue.md` using this frontmatter:

```markdown
---
title: "Fix /chat 500 error"
status: needs-triage
created: 2026-05-03
---

Issue body here.
```

## CLI equivalent

No CLI needed — read and write files directly. The `to-issues` skill writes here; `triage` reads and updates the `status:` field.
