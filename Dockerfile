FROM nginx:alpine

COPY . /home/src

RUN cd /home/src \
    && rm -rf /home/src/dist /home/src/dev-dist /home/src/node_modules \
    && rm -rf package-lock.json \
    && rm -rf yarn.lock \
    && rm -rf /home/src/node_modules \
    && cp /home/src/.npmrc /root/.npmrc \
    && chmod 600 /root/.npmrc \
    && apk add --update tzdata yarn npm \
    && yarn install \
    && yarn build \
    && cp -rf /home/src/dist/* /usr/share/nginx/html \
    && cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
    && rm /var/cache/apk/* \
    && rm -rf /home/src
