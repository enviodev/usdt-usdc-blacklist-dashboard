type Stats = {
    totalBlacklistedUSDT: number;
    totalBlacklistedUSDC: number;
    totalBlacklistedUSD1?: number;
    totalBlacklistedRLUSD?: number;
    totalDestroyedBlackFundsUSDT: string;
    totalBlacklistedUSDCDollarAmount?: string;
    totalBlacklistedUSDTDollarAmount?: string;
    totalBlacklistedUSD1DollarAmount?: string;
    totalBlacklistedRLUSDDollarAmount?: string;
};

export type Row = { index: number; account: string; balance?: string; balanceRaw?: string; timestamp?: string };
export type SeriesPoint = { date: string; value: number };

const QUERY = `#graphql
query TheListData(
  $limit: Int!
  $offsetUsdt: Int!
  $offsetUsdc: Int!
  $offsetUsd1: Int!
  $offsetRlusd: Int!
  $orderByUsdt: [User_order_by!]
  $orderByUsdc: [User_order_by!]
  $orderByUsd1: [User_order_by!]
  $orderByRlusd: [User_order_by!]
) {
  GlobalStats_by_pk(id: "GLOBAL") {
    totalBlacklistedUSDT
    totalBlacklistedUSDC
    totalBlacklistedUSD1
    totalBlacklistedRLUSD
    totalDestroyedBlackFundsUSDT
    totalBlacklistedUSDCDollarAmount
    totalBlacklistedUSDTDollarAmount
    totalBlacklistedUSD1DollarAmount
    totalBlacklistedRLUSDDollarAmount
  }
  User(where: {isBlacklistedByUSDT: {_eq: true}}, limit: $limit, offset: $offsetUsdt, order_by: $orderByUsdt) {
    id
    usdtBalance
    blacklistedAtUSDT
  }
  User2: User(where: {isBlacklistedByUSDC: {_eq: true}}, limit: $limit, offset: $offsetUsdc, order_by: $orderByUsdc) {
    id
    usdcBalance
    blacklistedAtUSDC
  }
  User3: User(where: {isBlacklistedByUSD1: {_eq: true}}, limit: $limit, offset: $offsetUsd1, order_by: $orderByUsd1) {
    id
    usd1Balance
    blacklistedAtUSD1
  }
  User4: User(where: {isBlacklistedByRLUSD: {_eq: true}}, limit: $limit, offset: $offsetRlusd, order_by: $orderByRlusd) {
    id
    rlusdBalance
    blacklistedAtRLUSD
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

function formatEpochToDateString(epochSecondsLike: string | number | undefined): string {
    if (!epochSecondsLike) return '';
    const sec = Number(epochSecondsLike);
    if (!Number.isFinite(sec)) return '';
    const d = new Date(sec * 1000);
    const dd = String(d.getDate()).padStart(2, '0');
    const mmm = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    const yyyy = String(d.getFullYear());
    return `${dd}-${mmm}-${yyyy}`;
}

function epochToYmd(epochSecondsLike: string | number | undefined): string | undefined {
    if (!epochSecondsLike) return undefined;
    const sec = Number(epochSecondsLike);
    if (!Number.isFinite(sec)) return undefined;
    const d = new Date(sec * 1000);
    const dd = String(d.getDate()).padStart(2, '0');
    const mmm = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    const yyyy = String(d.getFullYear());
    return `${dd}-${mmm}-${yyyy}`;
}

export async function fetchBlacklistData(opts?: {
    pageUsdt?: number;
    pageUsdc?: number;
    pageUsd1?: number;
    pageRlusd?: number;
    pageSize?: number;
    sortUsdt?: 'asc' | 'desc';
    sortUsdc?: 'asc' | 'desc';
    sortUsd1?: 'asc' | 'desc';
    sortRlusd?: 'asc' | 'desc';
    sortByUsdt?: 'balance' | 'date';
    sortByUsdc?: 'balance' | 'date';
    sortByUsd1?: 'balance' | 'date';
    sortByRlusd?: 'balance' | 'date';
}): Promise<{ stats: Stats; usdt: Row[]; usdc: Row[]; usd1: Row[]; rlusd: Row[]; pageCountUsdt: number; pageCountUsdc: number; pageCountUsd1: number; pageCountRlusd: number; }> {
    try {
        const endpoint = getEndpoint();
        const pageSize = Math.max(1, Math.min(200, opts?.pageSize ?? 20));
        const pageUsdt = Math.max(1, opts?.pageUsdt ?? 1);
        const pageUsdc = Math.max(1, opts?.pageUsdc ?? 1);
        const pageUsd1 = Math.max(1, opts?.pageUsd1 ?? 1);
        const pageRlusd = Math.max(1, opts?.pageRlusd ?? 1);
        const sortUsdt = opts?.sortUsdt ?? 'desc';
        const sortUsdc = opts?.sortUsdc ?? 'desc';
        const sortUsd1 = opts?.sortUsd1 ?? 'desc';
        const sortRlusd = opts?.sortRlusd ?? 'desc';
        const sortByUsdt = opts?.sortByUsdt ?? 'balance';
        const sortByUsdc = opts?.sortByUsdc ?? 'balance';
        const sortByUsd1 = opts?.sortByUsd1 ?? 'balance';
        const sortByRlusd = opts?.sortByRlusd ?? 'balance';
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
                    offsetUsd1: (pageUsd1 - 1) * pageSize,
                    offsetRlusd: (pageRlusd - 1) * pageSize,
                    orderByUsdt: sortByUsdt === 'date' ? [{ blacklistedAtUSDT: sortUsdt }] : [{ usdtBalance: sortUsdt }],
                    orderByUsdc: sortByUsdc === 'date' ? [{ blacklistedAtUSDC: sortUsdc }] : [{ usdcBalance: sortUsdc }],
                    orderByUsd1: sortByUsd1 === 'date' ? [{ blacklistedAtUSD1: sortUsd1 }] : [{ usd1Balance: sortUsd1 }],
                    orderByRlusd: sortByRlusd === 'date' ? [{ blacklistedAtRLUSD: sortRlusd }] : [{ rlusdBalance: sortRlusd }],
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
            totalBlacklistedUSD1: Number(g?.totalBlacklistedUSD1 ?? 0),
            totalBlacklistedRLUSD: Number(g?.totalBlacklistedRLUSD ?? 0),
            totalDestroyedBlackFundsUSDT: String(g?.totalDestroyedBlackFundsUSDT ?? '0'),
            totalBlacklistedUSDCDollarAmount: formatUnits(String(g?.totalBlacklistedUSDCDollarAmount ?? '0'), 6),
            totalBlacklistedUSDTDollarAmount: formatUnits(String(g?.totalBlacklistedUSDTDollarAmount ?? '0'), 6),
            totalBlacklistedUSD1DollarAmount: formatUnits(String(g?.totalBlacklistedUSD1DollarAmount ?? '0'), 6),
            totalBlacklistedRLUSDDollarAmount: formatUnits(String(g?.totalBlacklistedRLUSDDollarAmount ?? '0'), 6),
        };


        const usdt: Row[] = (json.data.User as Array<{ id: string; usdtBalance: string; blacklistedAtUSDT?: string }>)?.map((u, i) => {
            const raw = u.usdtBalance;
            const whole = formatUnits(raw, 6);
            return {
                index: i + (pageUsdt - 1) * pageSize,
                account: u.id,
                balance: formatWithCommas(whole),
                balanceRaw: whole,
                timestamp: formatEpochToDateString(u.blacklistedAtUSDT),
            };
        }) ?? [];
        const usdc: Row[] = (json.data.User2 as Array<{ id: string; usdcBalance: string; blacklistedAtUSDC?: string }>)?.map((u, i) => {
            const raw = u.usdcBalance;
            const whole = formatUnits(raw, 6);
            return {
                index: i + (pageUsdc - 1) * pageSize,
                account: u.id,
                balance: formatWithCommas(whole),
                balanceRaw: whole,
                timestamp: formatEpochToDateString(u.blacklistedAtUSDC),
            };
        }) ?? [];
        const usd1: Row[] = (json.data.User3 as Array<{ id: string; usd1Balance: string; blacklistedAtUSD1?: string }>)?.map((u, i) => {
            const raw = u.usd1Balance;
            const whole = formatUnits(raw, 6);
            return {
                index: i + (pageUsd1 - 1) * pageSize,
                account: u.id,
                balance: formatWithCommas(whole),
                balanceRaw: whole,
                timestamp: formatEpochToDateString(u.blacklistedAtUSD1),
            };
        }) ?? [];
        const rlusd: Row[] = (json.data.User4 as Array<{ id: string; rlusdBalance: string; blacklistedAtRLUSD?: string }>)?.map((u, i) => {
            const raw = u.rlusdBalance;
            const whole = formatUnits(raw, 6);
            return {
                index: i + (pageRlusd - 1) * pageSize,
                account: u.id,
                balance: formatWithCommas(whole),
                balanceRaw: whole,
                timestamp: formatEpochToDateString(u.blacklistedAtRLUSD),
            };
        }) ?? [];
        const pageCountUsdt = Math.max(1, Math.ceil(stats.totalBlacklistedUSDT / pageSize));
        const pageCountUsdc = Math.max(1, Math.ceil(stats.totalBlacklistedUSDC / pageSize));
        const pageCountUsd1 = Math.max(1, Math.ceil((stats.totalBlacklistedUSD1 ?? 0) / pageSize));
        const pageCountRlusd = Math.max(1, Math.ceil((stats.totalBlacklistedRLUSD ?? 0) / pageSize));

        return { stats, usdt, usdc, usd1, rlusd, pageCountUsdt, pageCountUsdc, pageCountUsd1, pageCountRlusd };
    } catch (err) {
        console.error('fetchBlacklistData error', err);
        const empty: Stats = {
            totalBlacklistedUSDT: 0,
            totalBlacklistedUSDC: 0,
            totalDestroyedBlackFundsUSDT: '0',
        };
        return { stats: empty, usdt: [], usdc: [], usd1: [], rlusd: [], pageCountUsdt: 1, pageCountUsdc: 1, pageCountUsd1: 1, pageCountRlusd: 1 };
    }
}

// Build daily cumulative series for USDT/USDC balances based on blacklist timestamps
export async function fetchCumulativeSeries(pageSize = 500): Promise<{ usdt: SeriesPoint[]; usdc: SeriesPoint[]; usd1: SeriesPoint[]; rlusd: SeriesPoint[] }> {
    const endpoint = getEndpoint();
    const build = async (which: 'usdt' | 'usdc') => {
        const isUsdt = which === 'usdt';
        const query = `#graphql\nquery Page($limit:Int!,$offset:Int!){\n  ${isUsdt ? 'User(where:{isBlacklistedByUSDT:{_eq:true}},order_by:{blacklistedAtUSDT:asc},limit:$limit,offset:$offset){id usdtBalance blacklistedAtUSDT}' : 'User(where:{isBlacklistedByUSDC:{_eq:true}},order_by:{blacklistedAtUSDC:asc},limit:$limit,offset:$offset){id usdcBalance blacklistedAtUSDC}'}\n}`;
        const dateToTotal = new Map<string, number>();
        let offset = 0;
        for (; ;) {
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables: { limit: pageSize, offset } }),
                cache: 'no-store',
            });
            if (!resp.ok) throw new Error(`GraphQL error ${resp.status}`);
            const json = await resp.json();
            const arr: Array<any> = json.data.User ?? [];
            if (arr.length === 0) break;
            for (const u of arr) {
                const rawBal: string = String(isUsdt ? u.usdtBalance : u.usdcBalance);
                const ts = isUsdt ? u.blacklistedAtUSDT : u.blacklistedAtUSDC;
                const dstr = epochToYmd(ts);
                if (!dstr) continue;
                // normalize by 6 decimals and drop fractional
                const whole = formatUnits(rawBal, 6);
                const prev = dateToTotal.get(dstr) ?? 0;
                dateToTotal.set(dstr, prev + Number(whole));
            }
            offset += arr.length;
            if (arr.length < pageSize) break;
        }
        // Build cumulative series in date order
        const keys = Array.from(dateToTotal.keys()).sort((a, b) => {
            const [ad, am, ay] = a.split('-').map(Number);
            const [bd, bm, by] = b.split('-').map(Number);
            const adate = new Date(ay, am - 1, ad).getTime();
            const bdate = new Date(by, bm - 1, bd).getTime();
            return adate - bdate;
        });
        const series: SeriesPoint[] = [];
        let running = 0;
        for (const k of keys) {
            running += dateToTotal.get(k) ?? 0;
            series.push({ date: k, value: running });
        }
        return series;
    };
    const [usdt, usdc] = await Promise.all([build('usdt'), build('usdc')]);
    // For USD1 / RLUSD, cumulative-by-user approach omitted for performance; prefer snapshot series below
    return { usdt, usdc, usd1: [], rlusd: [] };
}

export async function fetchSnapshotSeries(pageSize = 1000): Promise<{ usdt: SeriesPoint[]; usdc: SeriesPoint[]; usd1: SeriesPoint[]; rlusd: SeriesPoint[] }> {
    const endpoint = getEndpoint();
    const query = `#graphql
query Page($limit:Int!,$offset:Int!){
  BlacklistSnapshot(order_by:{timestamp:asc}, limit:$limit, offset:$offset){
    timestamp
    totalBlacklistedUSDTDollarAmount
    totalBlacklistedUSDCDollarAmount
    totalBlacklistedUSD1DollarAmount
    totalBlacklistedRLUSDDollarAmount
  }
}`;
    const points: Array<{ date: string; usdt: number; usdc: number; usd1: number; rlusd: number }> = [];
    let offset = 0;
    for (; ;) {
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { limit: pageSize, offset } }),
            cache: 'no-store',
        });
        if (!resp.ok) throw new Error(`GraphQL error ${resp.status}`);
        const json = await resp.json();
        const arr: Array<any> = json.data.BlacklistSnapshot ?? [];
        if (arr.length === 0) break;
        for (const s of arr) {
            const date = epochToYmd(s.timestamp);
            if (!date) continue;
            const usdtWhole = Number(formatUnits(String(s.totalBlacklistedUSDTDollarAmount ?? '0'), 6));
            const usdcWhole = Number(formatUnits(String(s.totalBlacklistedUSDCDollarAmount ?? '0'), 6));
            const usd1Whole = Number(formatUnits(String(s.totalBlacklistedUSD1DollarAmount ?? '0'), 6));
            const rlusdWhole = Number(formatUnits(String(s.totalBlacklistedRLUSDDollarAmount ?? '0'), 6));
            points.push({ date, usdt: usdtWhole, usdc: usdcWhole, usd1: usd1Whole, rlusd: rlusdWhole });
        }
        offset += arr.length;
        if (arr.length < pageSize) break;
    }
    const usdt: SeriesPoint[] = points.map(p => ({ date: p.date, value: p.usdt }));
    const usdc: SeriesPoint[] = points.map(p => ({ date: p.date, value: p.usdc }));
    const usd1: SeriesPoint[] = points.map(p => ({ date: p.date, value: p.usd1 }));
    const rlusd: SeriesPoint[] = points.map(p => ({ date: p.date, value: p.rlusd }));
    return { usdt, usdc, usd1, rlusd };
}


