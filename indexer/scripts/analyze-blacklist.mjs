import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = path.join(process.cwd(), "scripts", "output");
const USDT_FILE = path.join(OUTPUT_DIR, "usdt.json");
const USDC_FILE = path.join(OUTPUT_DIR, "usdc.json");

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse JSON: ${String(err)}`);
  }
}

function toBigIntSafe(value) {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function sumBigInt(values) {
  return values.reduce((acc, v) => acc + v, 0n);
}

function isZeroAddress(addr) {
  return /^0x0{40}$/i.test(addr);
}

function indexByAccount(entries) {
  const map = new Map();
  for (const e of entries) {
    if (!e || !e.account) continue;
    const account = e.account;
    const raw = toBigIntSafe(e.balanceRaw);
    map.set(account, (map.get(account) ?? 0n) + raw);
  }
  return map;
}

function topNFromMap(map, n) {
  return [...map.entries()]
    .sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))
    .slice(0, n);
}

function addThousands(intStr) {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatUnits(bigintValue, decimals) {
  const negative = bigintValue < 0n;
  const value = negative ? -bigintValue : bigintValue;
  const base = 10n ** BigInt(decimals);
  const integer = value / base;
  const fraction = value % base;
  const integerStr = addThousands(integer.toString());
  const fractionStr = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${negative ? "-" : ""}${integerStr}${
    fractionStr ? "." + fractionStr : ""
  }`;
}

function formatUnitsPretty(bigintValue, decimals, maxFractionDigits = 2) {
  const base = 10n ** BigInt(decimals);
  const negative = bigintValue < 0n;
  const value = negative ? -bigintValue : bigintValue;
  const integer = value / base;
  const fraction = value % base;
  const integerStr = addThousands(integer.toString());
  let fractionStr = fraction.toString().padStart(decimals, "0");
  if (maxFractionDigits >= 0) {
    fractionStr = fractionStr.slice(0, maxFractionDigits);
  }
  fractionStr = fractionStr.replace(/0+$/, "");
  return `${negative ? "-" : ""}${integerStr}${
    fractionStr ? "." + fractionStr : ""
  }`;
}

async function main() {
  const [usdtText, usdcText] = await Promise.all([
    fs.readFile(USDT_FILE, "utf8"),
    fs.readFile(USDC_FILE, "utf8"),
  ]);

  const usdtJson = parseJsonSafe(usdtText);
  const usdcJson = parseJsonSafe(usdcText);

  // Decimals; fallback to 6
  const usdtDecimals = Number(usdtJson.decimals ?? 6);
  const usdcDecimals = Number(usdcJson.decimals ?? 6);

  // Remove zero address entries
  const usdtEntries = (usdtJson.data ?? []).filter(
    (e) => e && e.account && !isZeroAddress(e.account)
  );
  const usdcEntries = (usdcJson.data ?? []).filter(
    (e) => e && e.account && !isZeroAddress(e.account)
  );

  const usdtTotalRaw = sumBigInt(
    usdtEntries.map((e) => toBigIntSafe(e.balanceRaw))
  );
  const usdcTotalRaw = sumBigInt(
    usdcEntries.map((e) => toBigIntSafe(e.balanceRaw))
  );

  const usdtByAccount = indexByAccount(usdtEntries);
  const usdcByAccount = indexByAccount(usdcEntries);

  const topUsdt = topNFromMap(usdtByAccount, 10);
  const topUsdc = topNFromMap(usdcByAccount, 10);
  const topUsdt20 = topNFromMap(usdtByAccount, 20);
  const topUsdc20 = topNFromMap(usdcByAccount, 20);

  const usdtTopFormatted = topUsdt.map(([account, raw]) => ({
    account,
    balanceRaw: raw.toString(),
    balance: formatUnits(raw, usdtDecimals),
    balancePretty: formatUnitsPretty(raw, usdtDecimals),
  }));
  const usdcTopFormatted = topUsdc.map(([account, raw]) => ({
    account,
    balanceRaw: raw.toString(),
    balance: formatUnits(raw, usdcDecimals),
    balancePretty: formatUnitsPretty(raw, usdcDecimals),
  }));

  const combinedTotal = toBigIntSafe(usdtTotalRaw) + toBigIntSafe(usdcTotalRaw);

  const summary = {
    asOf: new Date().toISOString(),
    totals: {
      usdt: {
        raw: usdtTotalRaw.toString(),
        formatted: formatUnits(usdtTotalRaw, usdtDecimals),
        formattedPretty: formatUnitsPretty(usdtTotalRaw, usdtDecimals),
        decimals: usdtDecimals,
        token: usdtJson.tokenSymbol ?? "USDT",
      },
      usdc: {
        raw: usdcTotalRaw.toString(),
        formatted: formatUnits(usdcTotalRaw, usdcDecimals),
        formattedPretty: formatUnitsPretty(usdcTotalRaw, usdcDecimals),
        decimals: usdcDecimals,
        token: usdcJson.tokenSymbol ?? "USDC",
      },
      combinedRaw: combinedTotal.toString(),
      combinedFormatted: `${formatUnits(
        usdtTotalRaw,
        usdtDecimals
      )} (USDT) + ${formatUnits(usdcTotalRaw, usdcDecimals)} (USDC)`,
      combinedFormattedPretty: `${formatUnitsPretty(
        usdtTotalRaw,
        usdtDecimals
      )} (USDT) + ${formatUnitsPretty(usdcTotalRaw, usdcDecimals)} (USDC)`,
    },
    top10: {
      usdt: usdtTopFormatted,
      usdc: usdcTopFormatted,
    },
  };

  const outPath = path.join(OUTPUT_DIR, "blacklist-analysis.json");
  await fs.writeFile(outPath, JSON.stringify(summary, null, 2));

  console.log("Analysis summary written to", outPath);
  console.table([
    { metric: "USDT total", value: summary.totals.usdt.formatted },
    { metric: "USDC total", value: summary.totals.usdc.formatted },
    { metric: "Combined", value: summary.totals.combinedFormatted },
  ]);

  const usdtTop20Display = topUsdt20.map(([account, raw]) => ({
    account,
    balance: formatUnitsPretty(raw, usdtDecimals),
  }));
  const usdcTop20Display = topUsdc20.map(([account, raw]) => ({
    account,
    balance: formatUnitsPretty(raw, usdcDecimals),
  }));

  console.log("\nTop 20 USDT accounts (by blacklisted balance):");
  console.table(usdtTop20Display);
  console.log("\nTop 20 USDC accounts (by blacklisted balance):");
  console.table(usdcTop20Display);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
