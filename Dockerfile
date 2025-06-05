FROM node:lts-slim AS base

RUN apt-get update -qy && apt-get install -qy wget

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
  apt-get install -qy -f ./viennarna.deb


# Setup the app user
RUN useradd -m app
RUN mkdir /app && chown app:app /app
WORKDIR /app
USER app

RUN --mount=type=cache,target=/home/app/.cache/uv \
  --mount=type=bind,source=uv.lock,target=uv.lock \
  --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
  uv sync --locked --no-cache
ENV PATH="/app/.venv/bin:$PATH"
RUN --mount=type=cache,id=pnpm,target=/home/app/.local/share/pnpm/store \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=package.json,target=package.json \
  pnpm install --frozen-lockfile


FROM base AS e2e

USER root
RUN npx playwright install-deps
USER app
RUN npx playwright install chromium
COPY --chown=app:app . /app/
RUN pnpm build
CMD ["pnpm", "playwright", "test"]

FROM base AS dev

COPY --chown=app:app . /app/
CMD ["pnpm", "dev"]


FROM base

COPY --chown=app:app . /app/
RUN pnpm build
CMD ["pnpm", "start"]

