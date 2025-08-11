FROM debian:12-slim AS base

RUN apt-get update -qy && \
  apt-get install -qy curl && \
  rm -rf /var/lib/apt/lists/*

# Install uv
# see: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.7.8 /uv /uvx /bin/

# Install pnpm
# see: https://github.com/pnpm/pnpm/releases/
RUN curl -o /usr/local/bin/pnpm https://github.com/pnpm/pnpm/releases/download/v10.14.0/pnpm-linuxstatic-x64 && \
  chmod +x /usr/local/bin/pnpm

# Install AWS Lambda Web Adapter
# see: https://github.com/awslabs/aws-lambda-web-adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# Install ViennaRNA
# see: https://www.tbi.univie.ac.at/RNA/#binary_packages
RUN curl -o viennarna.deb https://www.tbi.univie.ac.at/RNA/download/debian/debian_12/viennarna_2.7.0-1_amd64.deb && \
  apt-get update -qy && \
  apt-get install -qy -f ./viennarna.deb && \
  rm -rf viennarna.deb /var/lib/apt/lists/*

# Install BLAST+
# see: https://blast.ncbi.nlm.nih.gov/doc/blast-help/downloadblastdata.html
ARG BLAST_VERSION=2.17.0
RUN mkdir -p /blast/db && \
  curl -o /blast/ncbi-blast.tar.gz https://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/${BLAST_VERSION}/ncbi-blast-${BLAST_VERSION}+-x64-linux.tar.gz && \
  tar -xvf /blast/ncbi-blast.tar.gz --strip-components 1 -C /blast && \
  rm /blast/ncbi-blast.tar.gz
ENV PATH="/blast/bin/:$PATH"
RUN curl -o /blast/taxdb.tar.gz https://ftp.ncbi.nlm.nih.gov/blast/db/taxdb.tar.gz && \
  tar -xvf /blast/taxdb.tar.gz -C /blast/db && \
  rm /blast/taxdb.tar.gz
ENV BLASTDB="/blast/db/"

# Setup the app and virtualenv directory
RUN adduser app && mkdir /app && chown app:app /app
USER app
WORKDIR /app

ENV UV_COMPILE_BYTECODE=1
RUN --mount=type=bind,source=uv.lock,target=uv.lock \
  --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
  uv sync --locked --no-cache --no-install-project --all-groups
ENV PATH="/app/.venv/bin:$PATH"

RUN --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=package.json,target=package.json \
  pnpm install --frozen-lockfile


FROM base AS e2e

USER root
RUN --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=package.json,target=package.json \
  pnpm playwright install-deps
USER app
RUN --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=package.json,target=package.json \
  pnpm playwright install chromium --no-shell
COPY --chown=node:node . .
RUN --mount=type=cache,target=/root/.cache/uv \
  uv sync --locked
CMD ["pnpm", "playwright", "test"]


FROM base AS dev

COPY --chown=node:node . .
RUN --mount=type=cache,target=/root/.cache/uv \
  uv sync --locked
CMD ["pnpm", "dev"]


FROM base

COPY --chown=node:node . .
RUN --mount=type=cache,target=/root/.cache/uv \
  uv sync --locked
RUN pnpm build
CMD ["pnpm", "start"]

