## Summary

Describe the problem, the change, and the affected component(s). Link the related issue when one exists.

Closes #

## Change type

- [ ] Bug fix
- [ ] New capability
- [ ] Security hardening
- [ ] Documentation or developer-experience improvement
- [ ] Refactor or maintenance
- [ ] Breaking change

## Impact and operating considerations

Select every area affected and explain the change below.

- [ ] Authentication, sessions, identity, or authorization
- [ ] Sensitive-data handling, logging, telemetry, or outbound requests
- [ ] Proxy detection, policy evaluation, block/quarantine behavior, or performance
- [ ] Database schema, migrations, retention, or access controls
- [ ] Deployment, environment variables, integrations, or scheduled work
- [ ] Evidence, reporting, or audit-chain behavior
- [ ] None of the above

**Operational impact, threat-model note, and rollback plan:**

<!-- State why this change is safe to operate. For a relevant change, include boundary assumptions, migration order, required configuration, and how to roll it back. -->

## Validation

List the commands and checks you actually ran, with meaningful outcomes.

- [ ] Web plane: `npx tsc --noEmit`
- [ ] Web plane: `npm run lint`
- [ ] Web plane: `npm run test:coverage`
- [ ] Web plane: `npm run build`
- [ ] Proxy: `npm run lint`
- [ ] Proxy: `npm run test:coverage`
- [ ] Proxy: `npm run bench`
- [ ] Manual verification (describe below)
- [ ] Documentation-only validation (links, commands, and claims checked)

**Results and manual verification:**

<!-- Include failed or skipped checks and explain why. Do not state that a check passed unless you ran it. -->

## Review checklist

- [ ] The change is focused and does not include unrelated refactoring.
- [ ] Tests cover changed behavior, or the omission is explained above.
- [ ] No credentials, customer data, sensitive prompts, or production exports were added.
- [ ] Public claims are scoped, evidence-based, and consistent with the selected deployment boundary.
- [ ] Documentation and configuration guidance were updated where needed.
- [ ] Database migrations, configuration changes, and rollout dependencies are documented where applicable.
- [ ] I performed a self-review and addressed obvious failure paths.
