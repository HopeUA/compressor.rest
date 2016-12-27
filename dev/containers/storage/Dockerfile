FROM hope/nodejs:6

MAINTAINER Sergey Sadovoi <sergey@hope.ua>

ENV \
    APP_VERSION 0.1.4

WORKDIR /data/app

RUN \
    apk add --no-cache --virtual=build-dependencies git python make g++ && \
    git clone -b "v${APP_VERSION}" --single-branch --depth 1 https://github.com/HopeUA/storage.rest.git . && \
    npm install && \

    # Cleanup
    apk del build-dependencies

COPY rootfs/config.local.json /data/app/server/config.local.json

EXPOSE 3000

ENTRYPOINT ["npm"]
CMD ["start"]

