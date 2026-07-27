# Super Six

A Premier League score-prediction game. Every matchweek, 6 Saturday/Sunday Premier League
games are picked automatically. Players register with a username only (no password), predict
each scoreline, and earn points on a season-long leaderboard:

- **Exact score** → 3 points
- **Correct result** (right winner or draw, wrong scoreline) → 1 point

## Local setup

1. **Install dependencies** (already done if you're reading this after a fresh clone):
   ```bash
   npm install
   ```
2. **Get a free football-data.org API key**: register at https://www.football-data.org/client/register.
3. **Set up a local Postgres database:**
   ```bash
   brew install postgresql@16
   LC_ALL="en_US.UTF-8" /opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /opt/homebrew/var/postgresql@16 -l /tmp/pg16.log -o "-p 5433" start
   /opt/homebrew/opt/postgresql@16/bin/createdb -h localhost -p 5433 supersix
   ```
   (The `LC_ALL` env var works around a Homebrew Postgres 16 startup bug on some Macs — omit it
   if your `pg_ctl start` works without it. `npx prisma dev`, Prisma's own ephemeral local
   database, is an alternative but was unreliable in testing — the brew-installed server above is
   the tested path.)
4. **Copy `.env.example` to `.env`** and fill in:
   - `DATABASE_URL` — e.g. `postgresql://localhost:5433/supersix` for the local setup above
   - `FOOTBALL_DATA_API_KEY` — your football-data.org token
   - `SESSION_SECRET` — any random 32+ character string
   - `CRON_SECRET` — any random string (used to authenticate the two scheduled jobs below)
5. **Run the database migration:**
   ```bash
   npx prisma migrate dev --name init
   ```
6. **Start the dev server:**
   ```bash
   npm run dev
   ```

The site won't have any fixtures until the fixture-selection job runs once (see below).

## The two scheduled jobs

- `POST /api/cron/select-fixtures` — picks the next matchweek's 6 Saturday/Sunday fixtures.
  Runs automatically every Tuesday via `vercel.json`. To trigger manually while testing:
  ```bash
  curl -X POST http://localhost:3000/api/cron/select-fixtures \
    -H "Authorization: Bearer $CRON_SECRET"
  ```
- `POST /api/cron/update-results` — fetches final scores for the current round and awards points.
  Runs automatically every Monday. Trigger manually the same way, swapping the path.

Both routes reject requests without the correct `Authorization: Bearer <CRON_SECRET>` header.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add a Postgres database: Vercel dashboard → **Storage** → **Create Database** → **Neon**.
   This auto-populates `DATABASE_URL` as a project environment variable.
3. Add the remaining environment variables in the Vercel project settings:
   `FOOTBALL_DATA_API_KEY`, `SESSION_SECRET`, `CRON_SECRET`.
4. Run the migration against the production database once (e.g. locally with `DATABASE_URL`
   pointed at production, or via `npx prisma migrate deploy` in a Vercel build step).
5. Deploy. `vercel.json` registers the two cron schedules automatically — no extra setup needed.
6. After the first deploy, manually curl both cron routes once (with the real `CRON_SECRET`) to
   confirm they write to the production database before relying on the schedule.

## Known limitation: username-only auth

There's no password — anyone who knows an existing username can act as that user. This is an
intentional trade-off for a small, casual/family-scale game, not an oversight.
