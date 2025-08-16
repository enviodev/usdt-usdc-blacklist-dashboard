## USDT/USDC Blacklist Dashboard Indexer

This indexer tracks Tether (USDT) and Circle (USDC) blacklist events and maintains a simple per-address view with latest token balances.

### What it indexes

- **Contracts** on Ethereum mainnet (network id `1`):
  - `TetherToken` (USDT)
    - `AddedBlackList(address _user)`
    - `RemovedBlackList(address _user)`
    - `DestroyedBlackFunds(address _blackListedUser, uint256 _balance)`
  - `FiatTokenProxy` (USDC)
    - `Blacklisted(address indexed _account)`
    - `UnBlacklisted(address indexed _account)`
    - `BlacklisterChanged(address indexed newBlacklister)`

### Data model

- `User`
  - `id: ID!` (lowercased address)
  - `isBlacklistedByUSDT: Boolean!`
  - `isBlacklistedByUSDC: Boolean!`
  - `usdtBalance: BigInt!` (latest fetched balance)
  - `usdcBalance: BigInt!` (latest fetched balance)
- `GlobalStats` (singleton `id = "GLOBAL"`)
  - Counters for total users, total blacklisted per token, event counts, and destroyed black funds on USDT

### Balance fetching (Effect API + viem)

- External calls are performed via Envio's Effect API with `preload_handlers: true` enabled.
- On USDT `AddedBlackList`, the indexer fetches the user's latest USDT balance.
- On USDC `Blacklisted`, the indexer fetches the user's latest USDC balance.
- Balance calls use `viem` `readContract(balanceOf)` with HTTP transport batching and effect-level caching.
- Preload runs are guarded with `!context.isPreload` to avoid external calls during preload.

> Reference: HyperIndex Effects and preload guidance: [HyperIndex Complete Documentation](https://docs.envio.dev/docs/HyperIndex-LLM/hyperindex-complete)

### Important caveat about balances

- Balances are fetched at the **latest chain state** (no historical block).
- Blacklisted addresses cannot receive new tokens after they are blacklisted.
- Therefore, the latest balance for a blacklisted address will be the same as, or lower than, the balance at the time of blacklisting. It may decrease due to administrative actions (e.g., USDT `DestroyedBlackFunds`) or other contract-level mechanisms.
- If the indexer was deployed after an address was blacklisted, the latest-state fetch will still reflect these constraints (no incoming transfers post-blacklist). The indexer also tracks USDT destroyed funds in `GlobalStats.totalDestroyedBlackFundsUSDT`.

### Requirements

- Node.js v20 only
- pnpm
- Docker Desktop (for local dev environment)

### Environment

- Set an Ethereum RPC endpoint for `viem`:

```bash
export RPC_URL="https://your-mainnet-rpc"
```

> If self-hosting with HyperSync at scale, you may also set `ENVIO_API_TOKEN` as per the docs.

### Commands

- Generate files after changing `schema.graphql` or `config.yaml`:

```bash
pnpm codegen
```

- Type check after changing TypeScript files:

```bash
pnpm tsc --noEmit
```

- Start local development (GraphQL at http://localhost:8080, password `testing`):

```bash
pnpm dev
```

Optionally run without the interactive TUI:

```bash
TUI_OFF=true pnpm dev
```

### References

- HyperIndex docs: [HyperIndex Complete Documentation](https://docs.envio.dev/docs/HyperIndex-LLM/hyperindex-complete)
- Example indexers: Uniswap v4 (`https://github.com/enviodev/uniswap-v4-indexer`), Safe (`https://github.com/enviodev/safe-analysis-indexer`)
