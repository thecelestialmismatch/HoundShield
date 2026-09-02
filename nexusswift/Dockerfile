# syntax=docker/dockerfile:1.7
# ==========================================================================
# NexusSwift — production container image
#
# Multi-stage so that the toolchain needed to BUILD the cryptography wheel
# never ships in the image that runs in production. A compiler and header
# files in a running payment container are an attacker's post-exploitation
# toolkit; the runtime stage carries the interpreter, two libraries and the
# application, and nothing else.
# ==========================================================================

# --------------------------------------------------------------------------
# Stage 1 — builder
# --------------------------------------------------------------------------
FROM python:3.11-slim AS builder

# Fail the build on any error in a pipeline, not just the last command.
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# build-essential and libffi-dev are needed only if pip has to compile
# cryptography from source (no manylinux wheel for the target platform).
# They stay in this stage and are discarded with it.
RUN apt-get update \
 && apt-get install --no-install-recommends -y build-essential libffi-dev \
 && rm -rf /var/lib/apt/lists/*

# A virtualenv, rather than --user or the system site-packages, so the
# runtime stage can copy one self-contained directory with a single COPY.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Dependencies before application code: this layer is cached across every
# build in which requirements.txt has not changed, which is nearly all of
# them.
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel \
 && pip install -r requirements.txt

# --------------------------------------------------------------------------
# Stage 2 — runtime
# --------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

LABEL org.opencontainers.image.title="NexusSwift" \
      org.opencontainers.image.description="Zero-trust ISO 20022 pacs.008 cross-border clearing hub" \
      org.opencontainers.image.licenses="MIT"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PATH="/opt/venv/bin:$PATH" \
    NEXUSSWIFT_DB=/data/nexusswift.db

# A dedicated unprivileged account. Running as root means a container escape
# starts with root on the host namespace; --no-log-init avoids a sparse
# lastlog file for high UIDs.
RUN groupadd --system --gid 1001 nexus \
 && useradd --system --uid 1001 --gid nexus --no-log-init \
            --home-dir /app --shell /usr/sbin/nologin nexus

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
COPY --chown=nexus:nexus core/ ./core/
COPY --chown=nexus:nexus tests/ ./tests/
COPY --chown=nexus:nexus run.py ./

# The ledger lives on a volume. Without one, a container restart silently
# discards every settled payment — the container filesystem is ephemeral and
# a settlement journal is not.
RUN mkdir -p /data && chown nexus:nexus /data
VOLUME ["/data"]

USER nexus

# Reconciles the LIVE ledger: value conservation, hash-chain integrity, and
# agreement between stored balances and the journal. Cheap enough to run once
# a minute, and it checks the thing that actually matters in production.
#
# It deliberately does NOT re-run the full validation loop — that generates
# three RSA-4096 keys and clears a dozen payments, which would burn CPU that
# settlement needs and would only prove that a throwaway in-memory database
# works. Exits non-zero on any inconsistency, so a container whose ledger has
# drifted is never marked healthy.
HEALTHCHECK --interval=60s --timeout=15s --start-period=20s --retries=3 \
    CMD ["python", "run.py", "--healthcheck"]

ENTRYPOINT ["python", "run.py"]
CMD []
