FROM node:22-slim

# Install build tools needed for better-sqlite3 native module
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifests first — layer caching means npm install only reruns on dep changes
COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && npm cache clean --force

# Build TypeScript
COPY tsconfig.json ./
COPY *.ts ./
COPY patterns/ ./patterns/

RUN npm install -D typescript@^5.8.3 tsx@^4.19.3 \
    && npx tsc \
    && npm uninstall typescript tsx

# Runtime data directory (mounted as volume in production)
RUN mkdir -p /data && chown node:node /data

ENV NODE_ENV=production
ENV HOUNDSHIELD_DATA_DIR=/data
ENV PORT=8080

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
