Written mostly with Claude, this is purely a website to help a family member automate this as they have previously done it manually with friends.


# Predict Premier League

A Premier League score-prediction game. Every matchweek, 6 fixtures are picked automatically.
Players sign up with a username and password (no email), predict each scoreline, and earn points
on a season-long leaderboard:

- **Exact score** → 3 points
- **Correct result** (right winner or draw, wrong scoreline) → 1 point

Built with Next.js, Prisma, and Postgres, deployed on Vercel.

## Setup

1. `npm install`
2. Get a free API key from [football-data.org](https://www.football-data.org/client/register).
3. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `FOOTBALL_DATA_API_KEY`,
   `SESSION_SECRET`, and `CRON_SECRET`.
4. `npx prisma migrate dev --name init`
5. `npm run dev`

The site has no fixtures until the fixture-selection job (below) runs at least once.

## Scheduled jobs

- `POST /api/cron/select-fixtures` — picks the next matchday's fixtures (runs weekly)
- `POST /api/cron/sync-fixtures` — updates kickoff times/postponements if fixtures change (runs daily)
- `POST /api/cron/update-results` — scores predictions once games finish (runs weekly)

All three require an `Authorization: Bearer <CRON_SECRET>` header.

## Known limitation

There's no email on file and no password reset flow — if a password is forgotten, that account is
unrecoverable (the sign-up form warns about this). Intentional trade-off for a small, casual-scale
game rather than adding email-based recovery.
