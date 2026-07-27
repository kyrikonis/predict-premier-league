#!/bin/sh
# Neon's free-tier database suspends when idle; waking it up can take longer than
# Prisma Migrate's fixed 10s advisory-lock timeout, causing the first attempt after
# a period of inactivity to fail with P1002. Retrying with backoff rides out the
# cold start without requiring a separate "wake up the database" step.
set -e

attempt=1
max_attempts=4

until npx prisma migrate deploy; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "prisma migrate deploy failed after $attempt attempts"
    exit 1
  fi
  wait_seconds=$((attempt * 5))
  echo "prisma migrate deploy failed (attempt $attempt/$max_attempts), retrying in ${wait_seconds}s..."
  sleep "$wait_seconds"
  attempt=$((attempt + 1))
done
