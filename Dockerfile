# =============================================================================
# Root Dockerfile — Render deploy (repo root as Docker context)
#
# Render's default Docker setup looks for ./Dockerfile at the repository root.
# The canonical backend image definition lives in backend/Dockerfile (context:
# backend/) for docker-compose and Blueprint deploys with dockerContext: ./backend.
# =============================================================================

FROM rust:1.95-slim AS chef
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*
RUN cargo install cargo-chef
WORKDIR /app

FROM chef AS planner
COPY backend/ .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY backend/ .
RUN cargo build --release --bin mvr-backend

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*
RUN groupadd -r mvr && useradd -r -g mvr mvr
WORKDIR /app
COPY --from=builder /app/target/release/mvr-backend ./mvr-backend
COPY --from=builder /app/migrations ./migrations
RUN chown -R mvr:mvr /app
USER mvr
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
CMD ["./mvr-backend"]
