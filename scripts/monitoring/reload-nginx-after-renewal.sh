#!/bin/sh
# Certbot webroot renews files but does not load them into nginx.
set -eu
/usr/sbin/nginx -t
/usr/bin/systemctl reload nginx
