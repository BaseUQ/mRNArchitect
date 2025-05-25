FROM node:lts-slim AS base

RUN apt-get update -qy && apt-get install -qy wget

# Install uv
# see: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.7.8 /uv /uvx /bin/

# Install pnpm 
# see: https://pnpm.io/installation#using-corepack
RUN corepack enable

# Install AWS Lambda Web Adapter
# see: https://github.com/awslabs/aws-lambda-web-adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# Install ViennaRNA
# see: https://www.tbi.univie.ac.at/RNA/#binary_packages
ARG VIENNARNA_URL=https://www.tbi.univie.ac.at/RNA/download/debian/debian_12/viennarna_2.7.0-1_amd64.deb
RUN wget -qO viennarna.deb ${VIENNARNA_URL} && apt-get install -qy -f ./viennarna.deb

# Setup the app user
RUN useradd -m app
RUN mkdir /app && chown app:app /app
WORKDIR /app
USER app

RUN --mount=type=cache,target=/root.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-cache
ENV PATH="/app/.venv/bin:$PATH"
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=package.json,target=package.json \
    pnpm install --frozen-lockfile

COPY --chown=app:app . /app/


FROM base AS dev

CMD ["pnpm", "dev"]


FROM base

RUN pnpm build
CMD ["pnpm", "start"]

