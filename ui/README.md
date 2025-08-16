# the list

Terminal-inspired dashboard for USDT & USDC blacklisted addresses, powered by Next.js, Tailwind, and Hasura GraphQL.

## Setup

1. In this `ui/` directory, create a `.env.local` with your Hasura endpoint (and optional admin secret):

```
HASURA_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
HASURA_GRAPHQL_ADMIN_SECRET=testing
```

2. Install and run:

```
pnpm i
pnpm dev
```

By default the app runs on http://localhost:3000

## Notes

- The indexer must expose `User` and `GlobalStats` tables to Hasura.
- Only minimal fields are used; extend queries in `lib/hasura.ts` as needed.

