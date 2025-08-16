type Stats = {
    totalBlacklistedUSDT: number;
    totalBlacklistedUSDC: number;
    totalDestroyedBlackFundsUSDT: string;
};

export type Row = { index: number; account: string; balance?: string; balanceRaw?: string };

const QUERY = `#graphql
query TheListData(
  $limit: Int!
  $offsetUsdt: Int!
  $offsetUsdc: Int!
  $orderByUsdt: [User_order_by!]
  $orderByUsdc: [User_order_by!]
) {
  GlobalStats_by_pk(id: "GLOBAL") {
    totalBlacklistedUSDT
    totalBlacklistedUSDC
    totalDestroyedBlackFundsUSDT
  }
  User(where: {isBlacklistedByUSDT: {_eq: true}}, limit: $limit, offset: $offsetUsdt, order_by: $orderByUsdt) {
    id
    usdtBalance
  }
  User2: User(where: {isBlacklistedByUSDC: {_eq: true}}, limit: $limit, offset: $offsetUsdc, order_by: $orderByUsdc) {
    id
    usdcBalance
  }
}`;

function getEndpoint(): string {
    return process.env.HASURA_GRAPHQL_ENDPOINT ?? 'http://localhost:8080/v1/graphql';
}

function formatUnits(raw: string, decimals: number): string {
    try {
        const value = BigInt(raw);
        const base = BigInt(10) ** BigInt(decimals);
        const whole = value / base;
        return whole.toString();
    } catch {
        return raw;
    }
}

function formatWithCommas(numericString: string): string {
    const parts = numericString.split('.');
    const integerPart = parts[0];
    const sign = integerPart.startsWith('-') ? '-' : '';
    const digits = sign ? integerPart.slice(1) : integerPart;
    const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + withCommas;
}

export async function fetchBlacklistData(opts?: {
    pageUsdt?: number;
    pageUsdc?: number;
    pageSize?: number;
    sortUsdt?: 'asc' | 'desc';
    sortUsdc?: 'asc' | 'desc';
}): Promise<{ stats: Stats; usdt: Row[]; usdc: Row[]; pageCountUsdt: number; pageCountUsdc: number; }> {
    try {
        const endpoint = getEndpoint();
        const pageSize = Math.max(1, Math.min(200, opts?.pageSize ?? 20));
        const pageUsdt = Math.max(1, opts?.pageUsdt ?? 1);
        const pageUsdc = Math.max(1, opts?.pageUsdc ?? 1);
        const sortUsdt = opts?.sortUsdt ?? 'desc';
        const sortUsdc = opts?.sortUsdc ?? 'desc';
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: QUERY,
                variables: {
                    limit: pageSize,
                    offsetUsdt: (pageUsdt - 1) * pageSize,
                    offsetUsdc: (pageUsdc - 1) * pageSize,
                    orderByUsdt: [{ usdtBalance: sortUsdt }],
                    orderByUsdc: [{ usdcBalance: sortUsdc }],
                },
            }),
            cache: 'no-store',
        });

        if (!resp.ok) throw new Error(`Failed to fetch GraphQL: ${resp.status}`);
        const json = await resp.json();
        if (json.errors) throw new Error(JSON.stringify(json.errors));

        const g = json.data.GlobalStats_by_pk;
        const stats: Stats = {
            totalBlacklistedUSDT: Number(g?.totalBlacklistedUSDT ?? 0),
            totalBlacklistedUSDC: Number(g?.totalBlacklistedUSDC ?? 0),
            totalDestroyedBlackFundsUSDT: String(g?.totalDestroyedBlackFundsUSDT ?? '0'),
        };

        const usdt: Row[] = (json.data.User as Array<{ id: string; usdtBalance: string }>)?.map((u, i) => {
            const raw = u.usdtBalance;
            const whole = formatUnits(raw, 6);
            return {
                index: i + (pageUsdt - 1) * pageSize,
                account: u.id,
                balance: formatWithCommas(whole),
                balanceRaw: whole,
            };
        }) ?? [];
        const usdc: Row[] = (json.data.User2 as Array<{ id: string; usdcBalance: string }>)?.map((u, i) => {
            const raw = u.usdcBalance;
            const whole = formatUnits(raw, 6);
            return {
                index: i + (pageUsdc - 1) * pageSize,
                account: u.id,
                balance: formatWithCommas(whole),
                balanceRaw: whole,
            };
        }) ?? [];
        const pageCountUsdt = Math.max(1, Math.ceil(stats.totalBlacklistedUSDT / pageSize));
        const pageCountUsdc = Math.max(1, Math.ceil(stats.totalBlacklistedUSDC / pageSize));

        return { stats, usdt, usdc, pageCountUsdt, pageCountUsdc };
    } catch (err) {
        console.error('fetchBlacklistData error', err);
        const empty: Stats = {
            totalBlacklistedUSDT: 0,
            totalBlacklistedUSDC: 0,
            totalDestroyedBlackFundsUSDT: '0',
        };
        return { stats: empty, usdt: [], usdc: [], pageCountUsdt: 1, pageCountUsdc: 1 };
    }
}


