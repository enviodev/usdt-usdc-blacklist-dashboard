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
        <main className="mx-auto max-w-4xl p-2 md:p-6 space-y-1 font-mono">
            <header className="p-2 md:p-3">
                <div className="flex items-center justify-between">
                    <h1 className="terminal-title text-xl md:text-2xl">the list</h1>
                    <p className="mt-1 text-terminal-text text-sm">
                        USDT & USDC blacklisted addresses
                    </p>
                </div>
            </header>

            <section className="p-2 md:p-3">
                <table className="w-full text-left text-sm terminal-table border border-white">
                    <thead>
                        <tr className="text-terminal-text divide-x divide-white border-b border-white">
                            <th className="py-1 px-2 w-40">(index)</th>
                            <th className="py-1 px-2">metric</th>
                            <th className="py-1 px-2">value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="divide-x divide-white">
                            <td className="py-1 px-2 text-terminal-dim">0</td>
                            <td className="py-1 px-2 text-terminal-text">USDT total</td>
                            <td className="py-1 px-2 text-terminal-accent">{data.stats.totalBlacklistedUSDT.toLocaleString()}</td>
                        </tr>
                        <tr className="divide-x divide-white">
                            <td className="py-1 px-2 text-terminal-dim">1</td>
                            <td className="py-1 px-2 text-terminal-text">USDC total</td>
                            <td className="py-1 px-2 text-terminal-accent">{data.stats.totalBlacklistedUSDC.toLocaleString()}</td>
                        </tr>
                        <tr className="divide-x divide-white">
                            <td className="py-1 px-2 text-terminal-dim">2</td>
                            <td className="py-1 px-2 text-terminal-text">Combined</td>
                            <td className="py-1 px-2 text-terminal-accent">{`${data.stats.totalBlacklistedUSDT.toLocaleString()} + ${data.stats.totalBlacklistedUSDC.toLocaleString()}`}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section className="p-2 md:p-3">
                <div className="mb-1 flex gap-2">
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
            <footer className="p-2 text-center text-xs text-terminal-text">
                made with <span className="text-terminal-accent">❤</span> by <a href="https://envio.dev" target="_blank" rel="noopener noreferrer" className="hover:opacity-80">envio</a>
            </footer>
        </main>
    );
}
