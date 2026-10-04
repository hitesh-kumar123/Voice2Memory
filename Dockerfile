# Multi-stage Dockerfile for Voice2Memory
# Combines Node.js 20 runtime with Python 3.11 for faster-whisper

FROM node:20-bookworm-slim AS base

# Install Python, pip, ffmpeg, and build essentials for faster-whisper
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment for Python speech dependencies
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir faster-whisper==1.1.1

WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PYTHON_PATH="/opt/venv/bin/python3"

# Copy build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

CMD ["npm", "start"]
