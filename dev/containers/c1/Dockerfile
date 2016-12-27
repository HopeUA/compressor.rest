FROM hope/nodejs:6

MAINTAINER Sergey Sadovoi <sergey@hope.ua>

WORKDIR /data/app

COPY rootfs/run.sh /run.sh

RUN \
    apk add --no-cache ffmpeg curl openssh && \

    # Entrypoint
    chmod +x /run.sh

COPY rootfs/sshd_config /etc/ssh/sshd_config

EXPOSE 22

ENTRYPOINT ["/run.sh"]
