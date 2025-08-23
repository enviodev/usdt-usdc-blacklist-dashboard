import Link from 'next/link';
import { TerminalTable, Row as TableRow } from './TerminalTable';
import CumulativeChart from './CumulativeChart';
import { fetchSnapshotSeries } from '../lib/hasura';

type Stats = {
    totalBlacklistedUSDT: number;
    totalBlacklistedUSDC: number;
    totalDestroyedBlackFundsUSDT: string;
    totalBlacklistedUSDCDollarAmount?: string;
    totalBlacklistedUSDTDollarAmount?: string;
};

type Props = {
    selectedTab: 'usdt' | 'usdc' | 'graph';
    data: { stats: Stats; usdt: TableRow[]; usdc: TableRow[]; pageCountUsdt: number; pageCountUsdc: number };
    currentPage: number;
    sort: 'asc' | 'desc';
    sortBy?: 'balance' | 'date';
};

function formatCommas(numericString: string): string {
    const parts = numericString.split('.');
    const integerPart = parts[0];
    const sign = integerPart.startsWith('-') ? '-' : '';
    const digits = sign ? integerPart.slice(1) : integerPart;
    const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + withCommas;
}

export default async function PageContent({ selectedTab, data, currentPage, sort, sortBy = 'balance' }: Props) {
    const isUSDT = selectedTab === 'usdt';
    const isGraph = selectedTab === 'graph';
    const series = await fetchSnapshotSeries(1000);
    const pageHref = (page: number) => `${isUSDT ? '/USDT' : '/USDC'}?page=${page}&sort=${sort}${sortBy ? `&sortBy=${sortBy}` : ''}`;
    const sortHref = (nextSort: 'asc' | 'desc') => `${isUSDT ? '/USDT' : '/USDC'}?page=1&sort=${nextSort}`;
    return (
        <main className="mx-auto max-w-4xl p-2 md:p-6 space-y-1 font-mono">
            <header className="p-2 md:p-3">
                <div className="flex items-center justify-between">
                    <h1 className="terminal-title text-xl md:text-2xl">the list</h1>
                    <div className="mt-1 flex items-center gap-2 text-terminal-text text-sm">
                        <p>USDT & USDC blacklisted addresses</p>
                        <a
                            href="https://github.com/enviodev/usdt-usdc-blacklist-dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub repository"
                            className="hover:opacity-80"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12a12 12 0 0 0 8.21 11.43c.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.31-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.56.12-3.25 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.69.24 2.95.12 3.25.76.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.61-5.49 5.92.43.36.81 1.08.81 2.18 0 1.57-.01 2.84-.01 3.23 0 .32.22.7.83.58A12 12 0 0 0 24 12C24 5.37 18.63 0 12 0z" />
                            </svg>
                        </a>
                    </div>
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
                            <td className="py-1 px-2 text-terminal-value">${Number(data.stats.totalBlacklistedUSDTDollarAmount ?? '0').toLocaleString()}</td>
                        </tr>
                        <tr className="divide-x divide-white">
                            <td className="py-1 px-2 text-terminal-dim">1</td>
                            <td className="py-1 px-2 text-terminal-text">USDC total</td>
                            <td className="py-1 px-2 text-terminal-value">${Number(data.stats.totalBlacklistedUSDCDollarAmount ?? '0').toLocaleString()}</td>
                        </tr>
                        <tr className="divide-x divide-white">
                            <td className="py-1 px-2 text-terminal-dim"></td>
                            <td className="py-1 px-2 text-terminal-text w-[50%]"></td>
                            <td className="py-1 px-2 text-terminal-value border-t border-white">${
                                (
                                    Number(data.stats.totalBlacklistedUSDTDollarAmount ?? '0') +
                                    Number(data.stats.totalBlacklistedUSDCDollarAmount ?? '0')
                                ).toLocaleString()
                            }</td>
                        </tr>
                    </tbody>
                </table>
            </section>
            {false && (
                <section className="p-2 md:p-3">
                    <CumulativeChart usdt={series.usdt} usdc={series.usdc} />
                </section>
            )}

            <section className="p-2 md:p-3">
                <div className="mb-1 flex gap-2">
                    <Link
                        href="/USDT"
                        className={`${selectedTab === 'usdt' ? 'bg-white text-terminal-bg' : 'text-terminal-text'} border-t border-l border-r border-white px-3 py-1 -mb-px`}
                    >
                        -usdt-
                    </Link>
                    <Link
                        href="/USDC"
                        className={`${selectedTab === 'usdc' ? 'bg-white text-terminal-bg' : 'text-terminal-text'} border-t border-l border-r border-white px-3 py-1 -mb-px`}
                    >
                        -usdc-
                    </Link>
                    <Link
                        href="/GRAPH"
                        className={`${selectedTab === 'graph' ? 'bg-white text-terminal-bg' : 'text-terminal-text'} border-t border-l border-r border-white px-3 py-1 -mb-px`}
                    >
                        -graph-
                    </Link>
                </div>
                {isGraph ? (
                    <CumulativeChart usdt={series.usdt} usdc={series.usdc} />
                ) : isUSDT ? (
                    <TerminalTable rows={data.usdt} currentPage={currentPage} pageCount={data.pageCountUsdt} pageHref={pageHref} sort={sort} sortHref={sortHref} dateSortHref={(next) => `/USDT?page=1&sort=${next}&sortBy=date`} />
                ) : (
                    <TerminalTable rows={data.usdc} currentPage={currentPage} pageCount={data.pageCountUsdc} pageHref={pageHref} sort={sort} sortHref={sortHref} dateSortHref={(next) => `/USDC?page=1&sort=${next}&sortBy=date`} />
                )}
            </section>
            <footer className="p-2 text-center text-xs text-terminal-text">
                made with <span className="text-terminal-accent">❤</span> by <a href="https://envio.dev" target="_blank" rel="noopener noreferrer" className="hover:opacity-80">envio</a>
            </footer>
        </main>
    );
}
