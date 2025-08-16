/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  FiatTokenProxy,
  TetherToken,
  User,
  GlobalStats,
} from "generated";
import { getERC20Balance } from "./effects";

const GLOBAL_ID = "GLOBAL";

// Effect moved to src/effects.ts

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
    totalBlacklistedUSDTDollarAmount: 0n,
    totalBlacklistedUSDCDollarAmount: 0n,
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
    blacklistedAtUSDT: 0n,
    blacklistedAtUSDC: 0n
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
    blacklistedAtUSDC: BigInt(event.block.timestamp),
  };
  context.User.set(updatedUser);

  const becameBlacklisted = !user.isBlacklistedByUSDC;
  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalBlacklistEventsUSDC: stats.totalBlacklistEventsUSDC + 1n,
    totalBlacklistedUSDC: becameBlacklisted ? stats.totalBlacklistedUSDC + 1n : stats.totalBlacklistedUSDC,
    totalBlacklistedUSDCDollarAmount: stats.totalBlacklistedUSDCDollarAmount + (becameBlacklisted ? usdcBalance : 0n),
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
    blacklistedAtUSDC: user.blacklistedAtUSDC,
  };
  context.User.set(updatedUser);

  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalUnblacklistEventsUSDC: stats.totalUnblacklistEventsUSDC + 1n,
    totalBlacklistedUSDC: wasBlacklisted ? stats.totalBlacklistedUSDC - 1n : stats.totalBlacklistedUSDC,
    totalBlacklistedUSDCDollarAmount: wasBlacklisted ? (stats.totalBlacklistedUSDCDollarAmount - user.usdcBalance) : stats.totalBlacklistedUSDCDollarAmount,
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
    blacklistedAtUSDT: BigInt(event.block.timestamp),
  };
  context.User.set(updatedUser);

  const becameBlacklisted = !user.isBlacklistedByUSDT;
  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalBlacklistEventsUSDT: stats.totalBlacklistEventsUSDT + 1n,
    totalBlacklistedUSDT: becameBlacklisted ? stats.totalBlacklistedUSDT + 1n : stats.totalBlacklistedUSDT,
    totalBlacklistedUSDTDollarAmount: stats.totalBlacklistedUSDTDollarAmount + (becameBlacklisted ? usdtBalance : 0n),
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
    blacklistedAtUSDT: user.blacklistedAtUSDT,
  };
  context.User.set(updatedUser);

  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalUnblacklistEventsUSDT: stats.totalUnblacklistEventsUSDT + 1n,
    totalBlacklistedUSDT: wasBlacklisted ? stats.totalBlacklistedUSDT - 1n : stats.totalBlacklistedUSDT,
    totalBlacklistedUSDTDollarAmount: wasBlacklisted ? (stats.totalBlacklistedUSDTDollarAmount - user.usdtBalance) : stats.totalBlacklistedUSDTDollarAmount,
  };
  context.GlobalStats.set(updatedStats);
});
