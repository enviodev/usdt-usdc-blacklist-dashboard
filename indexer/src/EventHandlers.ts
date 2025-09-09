/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  FiatTokenProxy,
  TetherToken,
  USD1,
  RLUSD,
  User,
  GlobalStats,
  BlacklistSnapshot,
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
    totalBlacklistedUSD1: 0n,
    totalBlacklistedRLUSD: 0n,
    totalBlacklistEventsUSDT: 0n,
    totalUnblacklistEventsUSDT: 0n,
    totalBlacklistEventsUSDC: 0n,
    totalUnblacklistEventsUSDC: 0n,
    totalBlacklistEventsUSD1: 0n,
    totalUnblacklistEventsUSD1: 0n,
    totalBlacklistEventsRLUSD: 0n,
    totalUnblacklistEventsRLUSD: 0n,
    totalDestroyedBlackFundsUSDT: 0n,
    totalBlacklistedUSDTDollarAmount: 0n,
    totalBlacklistedUSDCDollarAmount: 0n,
    totalBlacklistedUSD1DollarAmount: 0n,
    totalBlacklistedRLUSDDollarAmount: 0n,
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
    isBlacklistedByUSD1: false,
    isBlacklistedByRLUSD: false,
    usdtBalance: 0n,
    usdcBalance: 0n,
    usd1Balance: 0n,
    rlusdBalance: 0n,
    blacklistedAtUSDT: 0n,
    blacklistedAtUSDC: 0n,
    blacklistedAtUSD1: 0n,
    blacklistedAtRLUSD: 0n
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
  // Write snapshot
  const snapUSDC: BlacklistSnapshot = {
    id: `${event.block.number.toString()}-${event.logIndex.toString()}-usdc` as any,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    totalBlacklistedUSDT: updatedStats.totalBlacklistedUSDT,
    totalBlacklistedUSDC: updatedStats.totalBlacklistedUSDC,
    totalBlacklistedUSD1: updatedStats.totalBlacklistedUSD1,
    totalBlacklistedRLUSD: updatedStats.totalBlacklistedRLUSD,
    totalBlacklistedUSDTDollarAmount: updatedStats.totalBlacklistedUSDTDollarAmount,
    totalBlacklistedUSDCDollarAmount: updatedStats.totalBlacklistedUSDCDollarAmount,
    totalBlacklistedUSD1DollarAmount: updatedStats.totalBlacklistedUSD1DollarAmount,
    totalBlacklistedRLUSDDollarAmount: updatedStats.totalBlacklistedRLUSDDollarAmount,
  };
  context.BlacklistSnapshot.set(snapUSDC);
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
  // Write snapshot
  const snapUSDCUn: BlacklistSnapshot = {
    id: `${event.block.number.toString()}-${event.logIndex.toString()}-usdc-un` as any,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    totalBlacklistedUSDT: updatedStats.totalBlacklistedUSDT,
    totalBlacklistedUSDC: updatedStats.totalBlacklistedUSDC,
    totalBlacklistedUSD1: updatedStats.totalBlacklistedUSD1,
    totalBlacklistedRLUSD: updatedStats.totalBlacklistedRLUSD,
    totalBlacklistedUSDTDollarAmount: updatedStats.totalBlacklistedUSDTDollarAmount,
    totalBlacklistedUSDCDollarAmount: updatedStats.totalBlacklistedUSDCDollarAmount,
    totalBlacklistedUSD1DollarAmount: updatedStats.totalBlacklistedUSD1DollarAmount,
    totalBlacklistedRLUSDDollarAmount: updatedStats.totalBlacklistedRLUSDDollarAmount,
  };
  context.BlacklistSnapshot.set(snapUSDCUn);
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
  // Write snapshot
  const snapUSDT: BlacklistSnapshot = {
    id: `${event.block.number.toString()}-${event.logIndex.toString()}-usdt` as any,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    totalBlacklistedUSDT: updatedStats.totalBlacklistedUSDT,
    totalBlacklistedUSDC: updatedStats.totalBlacklistedUSDC,
    totalBlacklistedUSD1: updatedStats.totalBlacklistedUSD1,
    totalBlacklistedRLUSD: updatedStats.totalBlacklistedRLUSD,
    totalBlacklistedUSDTDollarAmount: updatedStats.totalBlacklistedUSDTDollarAmount,
    totalBlacklistedUSDCDollarAmount: updatedStats.totalBlacklistedUSDCDollarAmount,
    totalBlacklistedUSD1DollarAmount: updatedStats.totalBlacklistedUSD1DollarAmount,
    totalBlacklistedRLUSDDollarAmount: updatedStats.totalBlacklistedRLUSDDollarAmount,
  };
  context.BlacklistSnapshot.set(snapUSDT);
});

TetherToken.DestroyedBlackFunds.handler(async ({ event, context }) => {
  const stats = await getOrCreateGlobalStats(context);
  const updatedStats: GlobalStats = {
    ...stats,
    totalDestroyedBlackFundsUSDT: stats.totalDestroyedBlackFundsUSDT + event.params._balance,
  };
  context.GlobalStats.set(updatedStats);
  // Write snapshot
  const snapUSDTUn: BlacklistSnapshot = {
    id: `${event.block.number.toString()}-${event.logIndex.toString()}-usdt-un` as any,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    totalBlacklistedUSDT: updatedStats.totalBlacklistedUSDT,
    totalBlacklistedUSDC: updatedStats.totalBlacklistedUSDC,
    totalBlacklistedUSD1: updatedStats.totalBlacklistedUSD1,
    totalBlacklistedRLUSD: updatedStats.totalBlacklistedRLUSD,
    totalBlacklistedUSDTDollarAmount: updatedStats.totalBlacklistedUSDTDollarAmount,
    totalBlacklistedUSDCDollarAmount: updatedStats.totalBlacklistedUSDCDollarAmount,
    totalBlacklistedUSD1DollarAmount: updatedStats.totalBlacklistedUSD1DollarAmount,
    totalBlacklistedRLUSDDollarAmount: updatedStats.totalBlacklistedRLUSDDollarAmount,
  };
  context.BlacklistSnapshot.set(snapUSDTUn);
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

// USD1 Freeze / Unfreeze handlers (mirrors USDC logic)
USD1.Freeze.handler(async ({ event, context }) => {
  const stats = await getOrCreateGlobalStats(context);
  const { user, isNew } = await getOrCreateUser(context, event.params.account);

  let usd1Balance = user.usd1Balance;
  if (!context.isPreload) {
    const usd1 = await context.effect(getERC20Balance, {
      tokenAddress: event.srcAddress,
      userAddress: event.params.account,
    });
    usd1Balance = BigInt(usd1);
  }

  const updatedUser: User = {
    ...user,
    isBlacklistedByUSD1: true,
    usd1Balance,
    blacklistedAtUSD1: BigInt(event.block.timestamp),
  };
  context.User.set(updatedUser);

  const becameBlacklisted = !user.isBlacklistedByUSD1;
  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalBlacklistEventsUSD1: stats.totalBlacklistEventsUSD1 + 1n,
    totalBlacklistedUSD1: becameBlacklisted ? stats.totalBlacklistedUSD1 + 1n : stats.totalBlacklistedUSD1,
    totalBlacklistedUSD1DollarAmount: stats.totalBlacklistedUSD1DollarAmount + (becameBlacklisted ? usd1Balance : 0n),
  };
  context.GlobalStats.set(updatedStats);

  const snapUSD1: BlacklistSnapshot = {
    id: `${event.block.number.toString()}-${event.logIndex.toString()}-usd1` as any,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    totalBlacklistedUSDT: updatedStats.totalBlacklistedUSDT,
    totalBlacklistedUSDC: updatedStats.totalBlacklistedUSDC,
    totalBlacklistedUSD1: updatedStats.totalBlacklistedUSD1,
    totalBlacklistedRLUSD: updatedStats.totalBlacklistedRLUSD,
    totalBlacklistedUSDTDollarAmount: updatedStats.totalBlacklistedUSDTDollarAmount,
    totalBlacklistedUSDCDollarAmount: updatedStats.totalBlacklistedUSDCDollarAmount,
    totalBlacklistedUSD1DollarAmount: updatedStats.totalBlacklistedUSD1DollarAmount,
    totalBlacklistedRLUSDDollarAmount: updatedStats.totalBlacklistedRLUSDDollarAmount,
  };
  context.BlacklistSnapshot.set(snapUSD1);
});

USD1.Unfreeze.handler(async ({ event, context }) => {
  const stats = await getOrCreateGlobalStats(context);
  const { user, isNew } = await getOrCreateUser(context, event.params.account);

  const wasBlacklisted = user.isBlacklistedByUSD1;
  const updatedUser: User = {
    ...user,
    isBlacklistedByUSD1: false,
    blacklistedAtUSD1: user.blacklistedAtUSD1,
  };
  context.User.set(updatedUser);

  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalUnblacklistEventsUSD1: stats.totalUnblacklistEventsUSD1 + 1n,
    totalBlacklistedUSD1: wasBlacklisted ? stats.totalBlacklistedUSD1 - 1n : stats.totalBlacklistedUSD1,
    totalBlacklistedUSD1DollarAmount: wasBlacklisted ? (stats.totalBlacklistedUSD1DollarAmount - user.usd1Balance) : stats.totalBlacklistedUSD1DollarAmount,
  };
  context.GlobalStats.set(updatedStats);

  const snapUSD1Un: BlacklistSnapshot = {
    id: `${event.block.number.toString()}-${event.logIndex.toString()}-usd1-un` as any,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    totalBlacklistedUSDT: updatedStats.totalBlacklistedUSDT,
    totalBlacklistedUSDC: updatedStats.totalBlacklistedUSDC,
    totalBlacklistedUSD1: updatedStats.totalBlacklistedUSD1,
    totalBlacklistedRLUSD: updatedStats.totalBlacklistedRLUSD,
    totalBlacklistedUSDTDollarAmount: updatedStats.totalBlacklistedUSDTDollarAmount,
    totalBlacklistedUSDCDollarAmount: updatedStats.totalBlacklistedUSDCDollarAmount,
    totalBlacklistedUSD1DollarAmount: updatedStats.totalBlacklistedUSD1DollarAmount,
    totalBlacklistedRLUSDDollarAmount: updatedStats.totalBlacklistedRLUSDDollarAmount,
  };
  context.BlacklistSnapshot.set(snapUSD1Un);
});

// RLUSD AccountPaused / AccountUnpaused handlers
RLUSD.AccountPaused.handler(async ({ event, context }) => {
  const stats = await getOrCreateGlobalStats(context);
  const { user, isNew } = await getOrCreateUser(context, event.params.account);

  let rlusdBalance = user.rlusdBalance;
  if (!context.isPreload) {
    const rlusd = await context.effect(getERC20Balance, {
      tokenAddress: event.srcAddress,
      userAddress: event.params.account,
    });
    rlusdBalance = BigInt(rlusd);
  }

  const updatedUser: User = {
    ...user,
    isBlacklistedByRLUSD: true,
    rlusdBalance,
    blacklistedAtRLUSD: BigInt(event.block.timestamp),
  };
  context.User.set(updatedUser);

  const becameBlacklisted = !user.isBlacklistedByRLUSD;
  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalBlacklistEventsRLUSD: stats.totalBlacklistEventsRLUSD + 1n,
    totalBlacklistedRLUSD: becameBlacklisted ? stats.totalBlacklistedRLUSD + 1n : stats.totalBlacklistedRLUSD,
    totalBlacklistedRLUSDDollarAmount: stats.totalBlacklistedRLUSDDollarAmount + (becameBlacklisted ? rlusdBalance : 0n),
  };
  context.GlobalStats.set(updatedStats);

  const snapRLUSD: BlacklistSnapshot = {
    id: `${event.block.number.toString()}-${event.logIndex.toString()}-rlusd` as any,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    totalBlacklistedUSDT: updatedStats.totalBlacklistedUSDT,
    totalBlacklistedUSDC: updatedStats.totalBlacklistedUSDC,
    totalBlacklistedUSD1: updatedStats.totalBlacklistedUSD1,
    totalBlacklistedRLUSD: updatedStats.totalBlacklistedRLUSD,
    totalBlacklistedUSDTDollarAmount: updatedStats.totalBlacklistedUSDTDollarAmount,
    totalBlacklistedUSDCDollarAmount: updatedStats.totalBlacklistedUSDCDollarAmount,
    totalBlacklistedUSD1DollarAmount: updatedStats.totalBlacklistedUSD1DollarAmount,
    totalBlacklistedRLUSDDollarAmount: updatedStats.totalBlacklistedRLUSDDollarAmount,
  };
  context.BlacklistSnapshot.set(snapRLUSD);
});

RLUSD.AccountUnpaused.handler(async ({ event, context }) => {
  const stats = await getOrCreateGlobalStats(context);
  const { user, isNew } = await getOrCreateUser(context, event.params.account);

  const wasBlacklisted = user.isBlacklistedByRLUSD;
  const updatedUser: User = {
    ...user,
    isBlacklistedByRLUSD: false,
    blacklistedAtRLUSD: user.blacklistedAtRLUSD,
  };
  context.User.set(updatedUser);

  const updatedStats: GlobalStats = {
    ...stats,
    totalUsers: isNew ? stats.totalUsers + 1n : stats.totalUsers,
    totalUnblacklistEventsRLUSD: stats.totalUnblacklistEventsRLUSD + 1n,
    totalBlacklistedRLUSD: wasBlacklisted ? stats.totalBlacklistedRLUSD - 1n : stats.totalBlacklistedRLUSD,
    totalBlacklistedRLUSDDollarAmount: wasBlacklisted ? (stats.totalBlacklistedRLUSDDollarAmount - user.rlusdBalance) : stats.totalBlacklistedRLUSDDollarAmount,
  };
  context.GlobalStats.set(updatedStats);

  const snapRLUSDUn: BlacklistSnapshot = {
    id: `${event.block.number.toString()}-${event.logIndex.toString()}-rlusd-un` as any,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    totalBlacklistedUSDT: updatedStats.totalBlacklistedUSDT,
    totalBlacklistedUSDC: updatedStats.totalBlacklistedUSDC,
    totalBlacklistedUSD1: updatedStats.totalBlacklistedUSD1,
    totalBlacklistedRLUSD: updatedStats.totalBlacklistedRLUSD,
    totalBlacklistedUSDTDollarAmount: updatedStats.totalBlacklistedUSDTDollarAmount,
    totalBlacklistedUSDCDollarAmount: updatedStats.totalBlacklistedUSDCDollarAmount,
    totalBlacklistedUSD1DollarAmount: updatedStats.totalBlacklistedUSD1DollarAmount,
    totalBlacklistedRLUSDDollarAmount: updatedStats.totalBlacklistedRLUSDDollarAmount,
  };
  context.BlacklistSnapshot.set(snapRLUSDUn);
});
