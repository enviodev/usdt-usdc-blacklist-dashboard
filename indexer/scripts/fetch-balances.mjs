import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { GraphQLClient, gql } from "graphql-request";
import {
  createPublicClient,
  http,
  erc20Abi,
  formatUnits,
  getAddress,
  isAddress,
} from "viem";
import { mainnet } from "viem/chains";

const GRAPHQL_ENDPOINT = "http://localhost:8080/v1/graphql";
const OUTPUT_DIR = path.join(process.cwd(), "scripts", "output");

const TOKENS = [
  {
    key: "usdt",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    symbol: "USDT",
    name: "Tether USD",
  },
  {
    key: "usdc",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eb48",
    decimals: 6,
    symbol: "USDC",
    name: "USD Coin",
  },
];

function requireEnv(name) {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

const rpcUrl = requireEnv("RPC_URL");

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

const gqlClient = new GraphQLClient(GRAPHQL_ENDPOINT);

const USERS_PAGE = gql`
  query Users($limit: Int!, $offset: Int!) {
    User(limit: $limit, offset: $offset) {
      id
    }
  }
`;

async function fetchAllUsers() {
  const limit = 500;
  let offset = 0;
  const users = [];
  while (true) {
    const resp = await gqlClient.request(USERS_PAGE, { limit, offset });
    const page = resp?.User ?? [];
    for (const u of page) {
      const id = String(u.id);
      if (isAddress(id)) users.push(getAddress(id));
    }
    if (page.length < limit) break;
    offset += limit;
  }
  return users;
}

async function readTokenMeta(token) {
  const address = getAddress(token.address);
  let { decimals, symbol, name } = token;
  try {
    const [onchainDecimals, onchainSymbol, onchainName] = await Promise.all([
      publicClient.readContract({
        address,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      publicClient
        .readContract({ address, abi: erc20Abi, functionName: "symbol" })
        .catch(() => symbol),
      publicClient
        .readContract({ address, abi: erc20Abi, functionName: "name" })
        .catch(() => name),
    ]);
    decimals = Number(onchainDecimals);
    symbol = onchainSymbol;
    name = onchainName;
  } catch (err) {
    // Use configured fallbacks on error
    console.warn(
      `Failed to read metadata for ${
        token.key
      }, using configured fallbacks. ${String(err)}`
    );
  }
  return { address, decimals, symbol, name };
}

async function getBalanceOf(tokenAddress, owner) {
  const balance = await publicClient.readContract({
    address: getAddress(tokenAddress),
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [getAddress(owner)],
  });
  return balance; // bigint
}

async function withConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const runners = new Array(Math.min(limit, items.length))
    .fill(null)
    .map(async () => {
      while (true) {
        const i = nextIndex++;
        if (i >= items.length) return;
        try {
          results[i] = await worker(items[i], i);
        } catch (err) {
          results[i] = { account: items[i], error: String(err) };
        }
      }
    });
  await Promise.all(runners);
  return results;
}

async function main() {
  const users = await fetchAllUsers();
  if (users.length === 0) {
    console.log("No users found.");
    return;
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const token of TOKENS) {
    const meta = await readTokenMeta(token);
    console.log(
      `Fetching ${meta.symbol} balances for ${users.length} users...`
    );

    const rawBalances = await withConcurrency(users, 10, async (user) => {
      const bal = await getBalanceOf(token.address, user);
      return { account: user, balanceRaw: bal };
    });

    const data = rawBalances.map((r) => {
      if (!r || r.error) {
        return {
          account: r?.account ?? null,
          error: r?.error ?? "unknown error",
        };
      }
      return {
        account: r.account,
        balanceRaw: r.balanceRaw.toString(),
        balance: formatUnits(r.balanceRaw, meta.decimals),
      };
    });

    const out = {
      tokenAddress: token.address,
      tokenSymbol: meta.symbol,
      tokenName: meta.name,
      decimals: meta.decimals,
      timestamp: new Date().toISOString(),
      count: data.length,
      data,
    };

    const outPath = path.join(OUTPUT_DIR, `${token.key}.json`);
    await writeFile(outPath, JSON.stringify(out, null, 2));
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
