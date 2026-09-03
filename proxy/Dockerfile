# syntax=docker/dockerfile:1
#
# Hound Shield proxy — the Mode B artifact. This is the image a CUI-handling
# contractor runs inside their own boundary, so what ships in it is part of the
# security posture, not a packaging detail.
#
# ─── What the single-stage build used to ship ──────────────────────────────
#
#   1. python3, make and g++ — installed for better-sqlite3's native build and
#      never removed, because there was only one stage for them to be removed
#      from. A C toolchain inside a container that handles CUI is attack
#      surface a customer's own scanner will flag.
#
#   2. The entire devDependency tree. `npm ci --omit=dev` ran, and was then
#      UNDONE by a later `npm install -D typescript tsx`: npm reconciles the
#      whole tree on install, so every devDependency came back. The following
#      `npm uninstall typescript tsx` removed exactly two of them, leaving
#      vitest and @vitest/coverage-v8 in a production image.
#
#   3. Compiled tests. `tsconfig.json` includes `**/*.ts`, `COPY *.ts ./` picked
#      up vitest.config.ts and `COPY ooda/` picked up ooda/__tests__, so `dist/`
#      shipped a test harness.
#
#   4. A different TypeScript major than CI type-checks with: the Dockerfile
#      pinned ^5.8.3 while package.json declares ^7.0.2. Two compilers, one
#      artifact, and only one of them gated by the build.
#
# All four are structural consequences of one stage. Two stages fix all four:
# the builder gets the toolchain and the full dependency tree, the runtime gets
# neither, and `.dockerignore` keeps the test tree out of both.

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-slim AS build

# Toolchain for better-sqlite3's native module. Confined to this stage, which
# is discarded — nothing here reaches the published image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Manifests first — layer caching means the install only reruns on dep changes.
COPY package.json package-lock.json* ./

# Full tree, devDependencies included: @types/* and the declared TypeScript are
# what `tsc` needs. No second `npm install` follows, so nothing can quietly
# reinstate what a later prune removes.
RUN npm ci

COPY tsconfig.json ./
COPY *.ts ./
COPY patterns/ ./patterns/
COPY ooda/ ./ooda/

# The repo's own compiler, at the version package.json declares. The image and
# CI now type-check with the same one.
RUN npx tsc

# Drop devDependencies from the tree that gets copied forward. better-sqlite3's
# compiled .node binary survives — prune removes packages, not build output —
# and both stages are node:22-slim, so the ABI matches.
RUN npm prune --omit=dev && npm cache clean --force

# ── Stage 2: runtime ────────────────────────────────────────────────────────
FROM node:22-slim AS runtime

WORKDIR /app

# Only what the process actually needs at runtime. No compiler, no headers, no
# source, no tests.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Runtime data directory (mounted as a volume in production)
RUN mkdir -p /data && chown node:node /data

ENV NODE_ENV=production
ENV HOUNDSHIELD_DATA_DIR=/data
ENV PORT=8080

USER node

EXPOSE 8080

# 10s rather than 5s: /health now reports licence source, and the first call on
# a cold container can spend up to the 5s licence-validation timeout before the
# result is cached for an hour. A probe that times out on the very first check
# would restart a healthy container.
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
