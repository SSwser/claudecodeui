FROM docker/sandbox-templates:codex

USER root
COPY shared/install-chorus.sh /tmp/install-chorus.sh
RUN chmod +x /tmp/install-chorus.sh && /tmp/install-chorus.sh

USER agent
RUN npm install -g @anthropic-ai/chorus

COPY shared/start-chorus.sh /home/agent/.chorus-start.sh
RUN echo '. ~/.chorus-start.sh' >> /home/agent/.bashrc
