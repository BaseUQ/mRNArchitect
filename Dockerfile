FROM debian:12 AS base

RUN apt-get update -qy && \
  apt-get install -qy wget=1.21.3-1+deb12u1 && \
  rm -rf /var/lib/apt/lists/*

# Install uv
# see: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.7.8 /uv /uvx /bin/

# Install ViennaRNA
# see: https://www.tbi.univie.ac.at/RNA/#binary_packages
RUN wget -qO viennarna.deb https://www.tbi.univie.ac.at/RNA/download/debian/debian_12/viennarna_2.7.0-1_amd64.deb && \
  apt-get update -qy && \
  apt-get install -qy -f ./viennarna.deb && \
  rm -rf viennarna.deb /var/lib/apt/lists/*

# Setup the app directory
RUN mkdir app && useradd -m app && chown app:app /app
USER app
WORKDIR /app

# Copy and install mRNArchitect
COPY --chown=app:app . .
RUN uv sync --locked
ENV PATH="/app/.venv/bin:$PATH"

ENTRYPOINT ["mRNArchitect"]
