FROM node:lts-slim AS base

RUN apt-get update -qy && \
  apt-get install -qy wget=1.21.3-1+deb12u1 && \
  rm -rf /var/lib/apt/lists/*

# Install uv
# see: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.7.8 /uv /uvx /bin/

# Install pnpm 
# see: https://github.com/pnpm/pnpm/releases/
RUN wget -qO /usr/local/bin/pnpm https://github.com/pnpm/pnpm/releases/download/v10.11.0/pnpm-linux-x64 && \
  chmod +x /usr/local/bin/pnpm

# Install AWS Lambda Web Adapter
# see: https://github.com/awslabs/aws-lambda-web-adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# Install ViennaRNA
# see: https://www.tbi.univie.ac.at/RNA/#binary_packages
RUN wget -qO viennarna.deb https://www.tbi.univie.ac.at/RNA/download/debian/debian_12/viennarna_2.7.0-1_amd64.deb && \
  apt-get update -qy && \
  apt-get install -qy -f ./viennarna.deb && \
  rm -rf /var/lib/apt/lists/*

# Install BLAST+
# see: https://blast.ncbi.nlm.nih.gov/doc/blast-help/downloadblastdata.html
RUN --mount=type=bind,source=ncbi-blast-2.16.0+-x64-linux.tar.gz,target=ncbi-blast.tar.gz \
  tar -xvf ncbi-blast.tar.gz --strip-components=2 -C /usr/bin/ --wildcards "*/bin/*"

# Setup the app directory
RUN mkdir /app
WORKDIR /app

RUN --mount=type=cache,target=/root/.cache/uv \
  --mount=type=bind,source=uv.lock,target=uv.lock \
  --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
  uv sync --locked --no-cache
ENV PATH="/app/.venv/bin:$PATH"
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=package.json,target=package.json \
  pnpm install --frozen-lockfile


FROM base AS e2e

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=package.json,target=package.json \
  pnpm playwright install chromium --no-shell --with-deps
COPY . .
CMD ["pnpm", "playwright", "test"]


FROM base AS dev

COPY . .
CMD ["pnpm", "dev"]


FROM base

COPY . .
RUN pnpm build
CMD ["pnpm", "start"]

