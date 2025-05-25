# Use the rocker/shiny base image
FROM rocker/shiny:latest

# Install system libraries
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install R packages
RUN R -e "install.packages(c('shiny', 'shinydashboard', 'shinyjs', 'shinyBS', 'shinyWidgets', 'shinycustomloader', 'reticulate', 'stringr', 'dplyr', 'fresh', 'seqinr', 'reactable', 'readr', 'tidyr', 'future', 'BiocManager'), repos='https://cloud.r-project.org/'); BiocManager::install('Biostrings')"

# Create a virtual environment for Python packages
RUN python3 -m venv /opt/venv

# Activate the virtual environment and install Python packages
RUN /opt/venv/bin/pip install numpy biopython dnachisel viennarna

# Copy the Shiny app to the Docker image
COPY . /srv/shiny-server/

# Change ownership of the Shiny app directory
RUN chown -R shiny:shiny /srv/shiny-server/

# Expose the Shiny app port
EXPOSE 3838

# Set RETICULATE_PYTHON environment variable
ENV RETICULATE_PYTHON /opt/venv/bin/python

# Start the Shiny server
CMD ["R", "-e", "shiny::runApp('/srv/shiny-server', port = 3838, host = '0.0.0.0')"]
