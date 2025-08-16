/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  FiatTokenProxy,
  TetherToken,
  User,
  GlobalStats,
} from "generated";
import { S, experimental_createEffect } from "envio";

const GLOBAL_ID = "GLOBAL";

export const getERC20Balance = experimental_createEffect(
  {
    name: "getERC20Balance",
    input: {
      tokenAddress: S.string,
      userAddress: S.string,
    },
    output: S.string,
    cache: true,
  },
  async ({ input }) => {
    const { createPublicClient, http } = await import("viem");
    const { mainnet } = await import("viem/chains");

    const client = createPublicClient({
      chain: mainnet,
      transport: http((process.env.RPC_URL || undefined), { batch: true }),
    });

    const erc20Abi = [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
      },
    ] as const;

    const balance = await client.readContract({
      address: input.tokenAddress as any,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [input.userAddress as any],
    });

    return balance.toString();
  }
);

async function getOrCreateGlobalStats(context: any): Promise<GlobalStats> {
  const existing = await context.GlobalStats.get(GLOBAL_ID);
  if (existing) return existing;

  const created: GlobalStats = {
    id: GLOBAL_ID,
    totalUsers: 0n,
    totalBlacklistedUSDT: 0n,
    totalBlacklistedUSDC: 0n,
    totalBlacklistEventsUSDT: 0n,
    totalUnblacklistEventsUSDT: 0n,
    totalBlacklistEventsUSDC: 0n,
    totalUnblacklistEventsUSDC: 0n,
    totalDestroyedBlackFundsUSDT: 0n,
  };
  context.GlobalStats.set(created);
  return created;
}

async function getOrCreateUser(context: any, address: string): Promise<{ user: User; isNew: boolean }> {
  const userId = address.toLowerCase();
  const existing = await context.User.get(userId);
  if (existing) return { user: existing, isNew: false };

  const created: User = {
    id: userId,
    isBlacklistedByUSDT: false,
    isBlacklistedByUSDC: false,
    usdtBalance: 0n,
    usdcBalance: 0n,
  };
  context.User.set(created);
  return { user: created, isNew: true };
}

FiatTokenProxy.Blacklisted.handler(async ({ event, context }) => {

  const stats = await getOrCreateGlobalStats(context);
  const { user, isNew } = await getOrCreateUser(context, event.params._account);

  let usdcBalance = user.usdcBalance;
  if (!context.isPreload) {
    const usdc = await context.effect(getERC20Balance, {
      tokenAddress: event.srcAddress,
      userAddress: event.params._account,
    });
    usdcBalance = BigInt(usdc);
  }

  const updatedUser: User = {
    ...user,
    isBlacklistedByUSDC: true,
    usdcBalance,
  };
  context.User.set(updatedUser);

  const becameBlacklisted = !user.isBlacklistedByUSDC;
  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalBlacklistEventsUSDC: stats.totalBlacklistEventsUSDC + 1n,
    totalBlacklistedUSDC: becameBlacklisted ? stats.totalBlacklistedUSDC + 1n : stats.totalBlacklistedUSDC,
  };
  context.GlobalStats.set(updatedStats);
});

FiatTokenProxy.UnBlacklisted.handler(async ({ event, context }) => {
  const stats = await getOrCreateGlobalStats(context);
  const { user, isNew } = await getOrCreateUser(context, event.params._account);

  const wasBlacklisted = user.isBlacklistedByUSDC;
  const updatedUser: User = {
    ...user,
    isBlacklistedByUSDC: false,
  };
  context.User.set(updatedUser);

  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalUnblacklistEventsUSDC: stats.totalUnblacklistEventsUSDC + 1n,
    totalBlacklistedUSDC: wasBlacklisted ? stats.totalBlacklistedUSDC - 1n : stats.totalBlacklistedUSDC,
  };
  context.GlobalStats.set(updatedStats);
});

TetherToken.AddedBlackList.handler(async ({ event, context }) => {
  const stats = await getOrCreateGlobalStats(context);
  const { user, isNew } = await getOrCreateUser(context, event.params._user);

  let usdtBalance = user.usdtBalance;
  if (!context.isPreload) {
    const usdt = await context.effect(getERC20Balance, {
      tokenAddress: event.srcAddress,
      userAddress: event.params._user,
    });
    usdtBalance = BigInt(usdt);
  }

  const updatedUser: User = {
    ...user,
    isBlacklistedByUSDT: true,
    usdtBalance,
  };
  context.User.set(updatedUser);

  const becameBlacklisted = !user.isBlacklistedByUSDT;
  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalBlacklistEventsUSDT: stats.totalBlacklistEventsUSDT + 1n,
    totalBlacklistedUSDT: becameBlacklisted ? stats.totalBlacklistedUSDT + 1n : stats.totalBlacklistedUSDT,
  };
  context.GlobalStats.set(updatedStats);
});

TetherToken.DestroyedBlackFunds.handler(async ({ event, context }) => {
  const stats = await getOrCreateGlobalStats(context);
  const updatedStats: GlobalStats = {
    ...stats,
    totalDestroyedBlackFundsUSDT: stats.totalDestroyedBlackFundsUSDT + event.params._balance,
  };
  context.GlobalStats.set(updatedStats);
});

TetherToken.RemovedBlackList.handler(async ({ event, context }) => {
  const stats = await getOrCreateGlobalStats(context);
  const { user, isNew } = await getOrCreateUser(context, event.params._user);

  const wasBlacklisted = user.isBlacklistedByUSDT;
  const updatedUser: User = {
    ...user,
    isBlacklistedByUSDT: false,
  };
  context.User.set(updatedUser);

  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalUnblacklistEventsUSDT: stats.totalUnblacklistEventsUSDT + 1n,
    totalBlacklistedUSDT: wasBlacklisted ? stats.totalBlacklistedUSDT - 1n : stats.totalBlacklistedUSDT,
  };
  context.GlobalStats.set(updatedStats);
});
