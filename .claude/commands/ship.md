---
name: ship
---

Create PR and prepare for merge:

1. `git status` — commit any uncommitted changes
2. `git log main..HEAD --oneline` — review what's being shipped
3. `cd compliance-firewall-agent && npm run build` — must pass
4. `npm test` — all green (fix failures, never skip)
5. Push and create PR:

```bash
git push origin [current-branch] -u
gh pr create --title "[type]: [description]" --body "$(cat <<'EOF'
## Summary
- [bullet 1]
- [bullet 2]

## Test plan
- [ ] npm run build passes
- [ ] Auth flow tested
- [ ] [specific feature] verified

## Checklist
- [ ] No hardcoded secrets
- [ ] TypeScript strict — no new `any`
- [ ] Tailwind only — no inline styles
- [ ] RLS on any new tables
- [ ] compliance engine patterns not reduced
EOF
)"
```

6. Share PR link with user. Highlight anything needing manual review.
