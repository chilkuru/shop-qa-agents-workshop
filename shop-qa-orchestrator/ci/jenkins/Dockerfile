FROM jenkins/jenkins:2.479.1-lts-jdk21

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends maven nodejs npm \
    && rm -rf /var/lib/apt/lists/*

USER jenkins

# allure-jenkins is what turns the merged results into the unified report.
RUN jenkins-plugin-cli --plugins \
    workflow-aggregator \
    git \
    allure-jenkins-plugin \
    junit \
    htmlpublisher \
    timestamper \
    ws-cleanup
