## USDT/USDC Blacklist Dashboard

This monorepo contains:

- `indexer/` — Envio HyperIndex project indexing USDT (Tether) and USDC (FiatTokenProxy) blacklist events, with Effect API + viem to fetch latest balances.
- `ui/` — Next.js app that displays totals and top blacklisted addresses with a terminal-like UI.

### Live repo

- GitHub: https://github.com/enviodev/usdt-usdc-blacklist-dashboard

### Prerequisites

- Node.js v20
- pnpm
- Docker Desktop (for running HyperIndex locally)

### Indexer quick start

1. Install deps

```bash
cd indexer
pnpm install
```

2. Generate types (after any schema/config change)

```bash
pnpm codegen
```

3. Type check (after any TS change)

```bash
pnpm tsc --noEmit
```

4. Run the indexer (local Hasura UI at http://localhost:8080)

```bash
TUI_OFF=true pnpm dev
```

Environment variables:

- `ENVIO_RPC_URL` — HTTPS mainnet RPC for viem (used by Effect API)

Documentation: see HyperIndex Complete Documentation: https://docs.envio.dev/docs/HyperIndex-LLM/hyperindex-complete

### UI quick start

```bash
cd ui
pnpm install
pnpm dev
```

Environment variables:

- `HASURA_GRAPHQL_ENDPOINT` (optional; defaults to `http://localhost:8080/v1/graphql`)

### Notes

- Balances are fetched at latest chain state. Blacklisted addresses cannot receive new tokens post-blacklisting; balances may decrease due to administrative actions (e.g., USDT DestroyedBlackFunds).
