# PR Automation & Deployment System

Complete system for creating production-ready PRs and deploying HoundShield with one command.

---

## PR Automation: The Complete Flow

### Step 1: Verify Task Completion

Before creating PR, ensure:
```bash
# 1. All tests pass
npm run test -- --coverage

# 2. TypeScript strict mode - zero errors
npm run typecheck

# 3. No console.logs or debug code
grep -r "console\." src/ --exclude-dir=node_modules | grep -v ".test.ts"

# 4. No hardcoded secrets or API keys
grep -r "REACT_APP_\|NODE_ENV\|KEY\|SECRET" src/ --include="*.ts" --include="*.tsx" | grep -v "process.env"

# 5. Dependency audit clean
npm audit

# 6. Performance test (latency < 10ms if applicable)
npm run test:performance
```

### Step 2: Create PR Branch

```bash
# Naming: feature/[task-id]-[short-description]
git checkout -b feature/task_001-gemini-flash-integration

# Ensure clean main
git pull origin main
```

### Step 3: Stage Changes

```bash
# Review what's changing
git status
git diff --stat

# Stage all changes
git add -A

# Review final changes
git diff --cached
```

### Step 4: Commit with Standard Message

```bash
git commit -m "
[TASK-001] Implement Gemini Flash LLM integration

- Integrate Gemini Flash for sub-10ms scanning
- Implement fallback regex logic for deterministic safety
- Add comprehensive test suite (95% coverage)
- Update documentation with latency benchmarks

PERFORMANCE:
- Scanning latency: 8.2ms average (target: <10ms)
- Load test: 1000 req/sec sustained (0 failures)
- Memory: 45MB baseline (target: <100MB)

TESTING:
- Unit: 52 tests PASS
- Integration: 18 tests PASS
- Performance: PASS (<10ms latency)
- Security: PASS (no secrets, OWASP aware)

Fixes #[issue_number] (if applicable)
"
```

### Step 5: Push to Remote

```bash
git push origin feature/task_001-gemini-flash-integration
```

### Step 6: Create PR with Standard Template

Create GitHub PR with this template:

```markdown
## What
Implement Gemini Flash LLM integration for sub-10ms compliance scanning

## Why
Current LLM routing lacks support for Gemini Flash, which offers optimal latency-to-capability tradeoff for compliance scanning. This is critical for meeting <10ms requirement under realistic load.

## How
- New LLM router module at `src/gateway/llm-router.ts`
- Gemini Flash selected for speed-sensitive scanning paths
- Regex fallback for deterministic detection (SSN, credit card, etc)
- Smart routing: route to Gemini Flash for speed, Claude for context-aware detection
- Config-driven LLM selection (environment variable)

## Testing
- [x] Unit tests: 52 passing (95% coverage)
- [x] Integration tests: 18 passing (all LLM paths tested)
- [x] Performance test: 8.2ms average latency (target: <10ms)
- [x] Load test: 1000 req/sec sustained, 0 failures
- [x] Security audit: OWASP Top 10 review, dependency audit clean

## Files Changed
- `src/gateway/llm-router.ts` (new)
- `src/gateway/gemini-flash.ts` (new)
- `src/gateway/regex-fallback.ts` (new)
- `src/config/llm-config.ts` (new)
- `tests/gateway/llm-router.test.ts` (new)
- `tests/gateway/gemini-flash.test.ts` (new)
- `docs/GATEWAY.md` (updated)
- `.env.example` (updated with LLM keys)

## Performance Metrics
Before: No Gemini Flash support
After: 8.2ms average latency (target: <10ms achieved)

Load test results:
- Throughput: 1000 req/sec sustained
- Latency p50: 6.1ms, p95: 8.8ms, p99: 9.7ms
- Error rate: 0%
- Memory: 52MB peak

## Compliance Review
- [x] CMMC L2: Aware of audit logging, no data leaves environment
- [x] HIPAA: PHI handling verified, encryption validated
- [x] SOC 2: Logging matches audit trail requirements
- [x] Security: No hardcoded keys, all env-based

## Code Review Checklist
- [x] TypeScript strict mode: 0 errors
- [x] No console.logs in production code
- [x] No hardcoded secrets
- [x] Error handling comprehensive
- [x] Documentation complete (JSDoc, README, CHANGELOG)
- [x] Tests comprehensive (100% critical path, 95% overall)
- [x] Ready to merge: YES

## Related
- Blocks: Nothing
- Blocked by: Nothing
- Related to: #[other_pr]

Task: task_001 (SESSION_STATE.json)

---

## Deployment

Deploy to staging with:
```bash
npm run deploy:staging
```

Staging verification required before prod deploy.

Deploy to production with:
```bash
npm run deploy:prod
```

This PR is ready for merge after single approval.
```

### Step 7: Request Review

Tag code reviewers in the PR:
```
/assign @reviewer-1 @reviewer-2
/request-review @security-team
```

---

## Automated Deployment Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy HoundShield

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: TypeScript strict mode
        run: npm run typecheck
      
      - name: Unit tests
        run: npm run test -- --coverage
      
      - name: Integration tests
        run: npm run test:integration
      
      - name: Performance tests
        run: npm run test:performance
      
      - name: Security audit
        run: npm audit
      
      - name: Lint and format
        run: npm run lint
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to staging
        env:
          STAGING_DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}
        run: |
          npm run deploy:staging

  deploy-prod:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to production
        env:
          PROD_DEPLOY_KEY: ${{ secrets.PROD_DEPLOY_KEY }}
        run: |
          npm run deploy:prod
      
      - name: Verify deployment
        run: |
          npm run verify:prod
      
      - name: Update SESSION_STATE.json
        run: |
          node scripts/update-session-state.js --deployment prod

  rollback:
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Notify rollback
        run: |
          echo "Deployment failed - manual rollback may be needed"
          echo "Check: npm run rollback:prod"
```

### Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "typecheck": "tsc --strict --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:integration": "vitest integration/",
    "test:performance": "node scripts/performance-test.js",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "build": "next build",
    "build:docker": "docker build -t kaelus:latest .",
    "start": "next start",
    "deploy:staging": "node scripts/deploy-staging.js",
    "deploy:prod": "node scripts/deploy-prod.js",
    "verify:prod": "node scripts/verify-prod.js",
    "rollback:prod": "node scripts/rollback-prod.js"
  }
}
```

### Deploy Script: `scripts/deploy-staging.js`

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Deploying to staging...');

try {
  // 1. Verify all tests pass
  console.log('✓ Running full test suite...');
  execSync('npm run test:coverage', { stdio: 'inherit' });
  
  // 2. Build production bundle
  console.log('✓ Building production bundle...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 3. Build Docker image
  console.log('✓ Building Docker image...');
  execSync('docker build -t kaelus:staging-$(date +%s) .', { stdio: 'inherit' });
  
  // 4. Deploy to staging environment
  console.log('✓ Pushing to staging...');
  execSync('docker push kaelus:staging-latest', { stdio: 'inherit' });
  
  // 5. Update staging deployment
  console.log('✓ Updating staging deployment...');
  execSync('kubectl set image deployment/kaelus-staging kaelus=kaelus:staging-latest -n staging', 
    { stdio: 'inherit' });
  
  // 6. Verify deployment
  console.log('✓ Verifying staging deployment...');
  execSync('node scripts/verify-staging.js', { stdio: 'inherit' });
  
  console.log('✅ Staging deployment complete!');
  console.log('Test: https://staging.kaelus.ai');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
```

### Deploy Script: `scripts/deploy-prod.js`

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying to production...');
console.log('⚠️  This is a PRODUCTION deployment. Verify all checks pass.');

try {
  // 1. Verify staging passed
  console.log('✓ Verifying staging deployment health...');
  execSync('curl -f https://staging.kaelus.ai/health || exit 1', { stdio: 'inherit' });
  
  // 2. Create backup of current prod
  console.log('✓ Creating production backup...');
  execSync('kubectl get deployment kaelus-prod -n prod -o yaml > /tmp/prod-backup-$(date +%s).yaml', 
    { stdio: 'inherit' });
  
  // 3. Deploy to production
  console.log('✓ Deploying to production...');
  execSync('docker push kaelus:prod-latest', { stdio: 'inherit' });
  execSync('kubectl set image deployment/kaelus-prod kaelus=kaelus:prod-latest -n prod', 
    { stdio: 'inherit' });
  
  // 4. Wait for rollout
  console.log('✓ Waiting for deployment...');
  execSync('kubectl rollout status deployment/kaelus-prod -n prod --timeout=5m', 
    { stdio: 'inherit' });
  
  // 5. Verify production
  console.log('✓ Verifying production deployment...');
  execSync('node scripts/verify-prod.js', { stdio: 'inherit' });
  
  // 6. Update SESSION_STATE.json
  console.log('✓ Updating session state...');
  const sessionState = JSON.parse(fs.readFileSync('SESSION_STATE.json', 'utf8'));
  sessionState.deployments.push({
    environment: 'prod',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
  fs.writeFileSync('SESSION_STATE.json', JSON.stringify(sessionState, null, 2));
  
  console.log('✅ Production deployment complete!');
  console.log('Live: https://kaelus.ai');
  console.log('Monitoring: https://dash.kaelus.ai/metrics');
  
} catch (error) {
  console.error('❌ Production deployment failed:', error.message);
  console.error('ROLLBACK: npm run rollback:prod');
  process.exit(1);
}
```

---

## One-Command PR + Deploy

Create master script `scripts/ship.js`:

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  try {
    // 1. Get task info
    const taskId = await ask('Enter task ID (e.g., task_001): ');
    const title = await ask('Enter PR title: ');
    const description = await ask('Enter description: ');
    
    // 2. Create branch
    const branch = `feature/${taskId}-${title.toLowerCase().replace(/ /g, '-')}`;
    console.log(`Creating branch: ${branch}`);
    execSync(`git checkout -b ${branch}`, { stdio: 'inherit' });
    
    // 3. Verify tests pass
    console.log('Running test suite...');
    execSync('npm run test:coverage', { stdio: 'inherit' });
    
    // 4. Create commit
    console.log('Creating commit...');
    execSync(`git add -A`, { stdio: 'inherit' });
    execSync(`git commit -m "[${taskId}] ${title}\n\n${description}"`, { stdio: 'inherit' });
    
    // 5. Push to remote
    console.log('Pushing to remote...');
    execSync(`git push origin ${branch}`, { stdio: 'inherit' });
    
    // 6. Create PR
    console.log('Creating GitHub PR...');
    const prUrl = await execSync(`gh pr create --title "[${taskId}] ${title}" --body "${description}"`, 
      { encoding: 'utf8' }).trim();
    
    console.log(`✅ PR created: ${prUrl}`);
    
    // 7. Deploy to staging
    const deploy = await ask('Deploy to staging? (y/n): ');
    if (deploy.toLowerCase() === 'y') {
      execSync('npm run deploy:staging', { stdio: 'inherit' });
    }
    
    console.log('✅ Complete! PR ready for review.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
```

Use it:
```bash
npm run ship
```

---

## Monitoring & Alerts

Set up Slack/email alerts for:
- Deployment started
- Deployment success/failure
- Performance degradation
- Error rate increase
- Resource usage alerts

---

## Rollback Procedure

If deployment fails:
```bash
npm run rollback:prod
```

This:
1. Reverts to previous Docker image
2. Reapplies last known good config
3. Waits for rollout
4. Verifies health
5. Notifies team

---

**Last Updated**: 2026-04-28  
**Status**: Ready to integrate into HoundShield  
**Standard**: "Holy shit, that's done"
