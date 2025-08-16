import Link from 'next/link';
import { TerminalTable, Row as TableRow } from './TerminalTable';

type Stats = {
    totalBlacklistedUSDT: number;
    totalBlacklistedUSDC: number;
    totalDestroyedBlackFundsUSDT: string;
};

type Props = {
    selectedTab: 'usdt' | 'usdc';
    data: { stats: Stats; usdt: TableRow[]; usdc: TableRow[]; pageCountUsdt: number; pageCountUsdc: number };
    currentPage: number;
    sort: 'asc' | 'desc';
};

function formatCommas(numericString: string): string {
    const parts = numericString.split('.');
    const integerPart = parts[0];
    const sign = integerPart.startsWith('-') ? '-' : '';
    const digits = sign ? integerPart.slice(1) : integerPart;
    const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + withCommas;
}

export default function PageContent({ selectedTab, data, currentPage, sort }: Props) {
    const isUSDT = selectedTab === 'usdt';
    const pageHref = (page: number) => `${isUSDT ? '/USDT' : '/USDC'}?page=${page}&sort=${sort}`;
    const sortHref = (nextSort: 'asc' | 'desc') => `${isUSDT ? '/USDT' : '/USDC'}?page=1&sort=${nextSort}`;
    return (
        <main className="mx-auto max-w-6xl p-4 md:p-8 space-y-2 font-mono">
            <header className="p-2 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="terminal-title text-xl md:text-2xl">the list</h1>
                </div>
                <p className="mt-2 text-terminal-text text-sm">
                    USDT & USDC blacklisted addresses observed by the indexer.
                </p>
            </header>

            <section className="p-2 md:p-6">
                <div className="mb-2 flex gap-2">
                    <Link
                        href="/USDT"
                        className={`${isUSDT ? 'bg-white text-terminal-bg' : 'text-terminal-text'} border-t border-l border-r border-white px-3 py-1 -mb-px`}
                    >
                        -usdt-
                    </Link>
                    <Link
                        href="/USDC"
                        className={`${!isUSDT ? 'bg-white text-terminal-bg' : 'text-terminal-text'} border-t border-l border-r border-white px-3 py-1 -mb-px`}
                    >
                        -usdc-
                    </Link>
                </div>
                {isUSDT ? (
                    <TerminalTable rows={data.usdt} currentPage={currentPage} pageCount={data.pageCountUsdt} pageHref={pageHref} sort={sort} sortHref={sortHref} />
                ) : (
                    <TerminalTable rows={data.usdc} currentPage={currentPage} pageCount={data.pageCountUsdc} pageHref={pageHref} sort={sort} sortHref={sortHref} />
                )}
            </section>
        </main>
    );
}
