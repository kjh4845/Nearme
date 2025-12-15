#!/bin/sh
set -e

CERT_DIR=/etc/nginx/certs
CRT=$CERT_DIR/server.crt
KEY=$CERT_DIR/server.key

mkdir -p "$CERT_DIR"

if [ ! -f "$CRT" ] || [ ! -f "$KEY" ]; then
  echo "Generating self-signed certificate..."
  openssl req -x509 -nodes -days "${SSL_DAYS:-3650}" -newkey rsa:2048 \
    -subj "/CN=${SSL_CN:-localhost}" \
    -addext "subjectAltName=${SSL_SAN:-DNS:localhost,IP:127.0.0.1}" \
    -keyout "$KEY" -out "$CRT"
else
  echo "Using existing certificate at $CERT_DIR"
fi

exec nginx -g 'daemon off;'
