---
name: fix-issue
argument-hint: [github-issue-number]
---

Fix GitHub issue #$ARGUMENTS:

1. `gh issue view $ARGUMENTS` — read the full issue + comments
2. Run `semantic_search_nodes` or `query_graph` to find relevant source files
3. Read identified files to understand current behavior
4. State root cause clearly: "X is broken because Y"
5. Implement minimal fix — change only what's needed
6. Write a regression test that would have caught this bug
7. `npm run build` — must pass
8. `npm test` — all green
9. `git commit -m "fix: [description] (closes #$ARGUMENTS)"`
10. `gh pr create` with issue reference in body
