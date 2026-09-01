#!/bin/sh
set -e

# ./data is bind-mounted from the host and created by Docker as root the
# first time — the app must run as an unprivileged user, so fix ownership
# before dropping to it.
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

gosu nextjs npx prisma migrate deploy

exec gosu nextjs "$@"
