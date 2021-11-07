FROM python:3.7
RUN curl -fsSL https://get.docker.com | sh
RUN pip3 install docker molecule[docker,ansible] pytest pytest-testinfra flake8
WORKDIR mono/deployment-e2e
