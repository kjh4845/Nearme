FROM nginx:1.25-alpine

RUN apk add --no-cache openssl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV SSL_CN=localhost
ENV SSL_SAN=DNS:localhost,IP:127.0.0.1
ENV SSL_DAYS=3650

CMD ["/entrypoint.sh"]
