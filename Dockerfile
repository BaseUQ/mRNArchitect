FROM node:lts-slim AS base

RUN apt-get update -qy && \
  apt-get install -qy wget && \
  rm -rf /var/lib/apt/lists/*

# Install uv
# see: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.9.5 /uv /uvx /bin/

# Install pnpm 
# see: https://github.com/pnpm/pnpm/releases/
RUN wget -qO /usr/local/bin/pnpm https://github.com/pnpm/pnpm/releases/download/v10.20.0/pnpm-linux-x64 && \
  chmod +x /usr/local/bin/pnpm

# Install AWS Lambda Web Adapter
# see: https://github.com/awslabs/aws-lambda-web-adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# Install ViennaRNA
# see: https://www.tbi.univie.ac.at/RNA/#binary_packages
RUN wget -qO viennarna.deb https://www.tbi.univie.ac.at/RNA/download/debian/debian_12/viennarna_2.7.0-1_amd64.deb && \
  apt-get update -qy && \
  apt-get install -qy -f ./viennarna.deb && \
  rm -rf viennarna.deb /var/lib/apt/lists/*

# Install BLAST+
# see: https://blast.ncbi.nlm.nih.gov/doc/blast-help/downloadblastdata.html
# see: https://hub.docker.com/r/ncbi/blast
# COPY --from=docker.io/ncbi/blast:2.17.0 /blast /blast
# RUN apt-get update -qy && \
#   apt-get install -qy curl libidn12 libnet-perl perl-doc liblmdb-dev wget libsqlite3-dev perl && \
#   rm -rf /var/lib/apt/lists/*
# ENV PATH="/blast/bin:$PATH"
# ENV BLASTDB="/blast/blastdb/"
# WORKDIR ${BLASTDB}
# RUN update_blastdb.pl --decompress --verbose taxdb

# Setup the app directory
RUN mkdir /app
WORKDIR /app

ENV UV_COMPILE_BYTECODE=1
RUN --mount=type=bind,source=uv.lock,target=uv.lock \
  --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
  --mount=type=cache,target=/home/app/.cache/uv \
  uv sync --locked --no-install-project --all-groups
ENV PATH="/app/.venv/bin:$PATH"

RUN --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=package.json,target=package.json \
  --mount=type=cache,target=/home/node/.pnpm-store \
  pnpm install --frozen-lockfile

COPY . .
RUN --mount=type=bind,source=uv.lock,target=uv.lock \
  --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
  --mount=type=cache,target=/home/app/.cache/uv \
  uv sync --locked


FROM base AS e2e

#RUN pnpm install @playwright/test@latest
RUN pnpm playwright install-deps
RUN pnpm playwright install chromium --no-shell
RUN pnpm run build
CMD ["pnpm", "playwright", "test"]


FROM base AS dev

CMD ["pnpm", "run", "dev"]


FROM base as prod

RUN pnpm run build
CMD ["pnpm", "run", "start"]
