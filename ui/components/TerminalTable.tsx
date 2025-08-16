import Link from "next/link";

export type Row = { index: number; account: string; balance?: string; balanceRaw?: string };

export function TerminalTable({
    rows,
    currentPage,
    pageCount,
    pageHref,
    sort,
    sortHref,
}: {
    rows: Row[];
    currentPage: number;
    pageCount: number;
    pageHref: (page: number) => string;
    sort: "asc" | "desc";
    sortHref: (nextSort: "asc" | "desc") => string;
}) {
    const nextSort = sort === "asc" ? "desc" : "asc";
    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left text-sm terminal-table border border-white">
                    <thead>
                        <tr className="text-terminal-text divide-x divide-white border-b border-white">
                            <th className="py-1 px-2 w-20">(index)</th>
                            <th className="py-1 px-2 ">account</th>
                            <th className="py-1 px-2 w-40">
                                <Link href={sortHref(nextSort)} className="inline-flex items-center gap-1">
                                    <span>balance</span>
                                    <span className="text-terminal-text">{sort === "asc" ? "▲" : "▼"}</span>
                                </Link>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.index} className="divide-x divide-white">
                                <td className="py-1 px-2 text-terminal-dim">{r.index}</td>
                                <td className="py-1 px-2 text-terminal-accent w-[26ch] max-w-[26ch] truncate">
                                    <Link href={`https://etherscan.io/address/${r.account}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                                        {r.account}
                                    </Link>
                                </td>
                                <td className="py-1 px-2 text-terminal-warning">{r.balance != undefined ? "$" + r.balance : ""}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-terminal-text">
                <div>page {currentPage} / {pageCount}</div>
                <div className="space-x-2">
                    <Link className="px-2 py-1 border border-white aria-disabled:opacity-50" href={pageHref(1)} aria-disabled={currentPage === 1}>«</Link>
                    <Link className="px-2 py-1 border border-white aria-disabled:opacity-50" href={pageHref(Math.max(1, currentPage - 1))}>prev</Link>
                    <Link className="px-2 py-1 border border-white aria-disabled:opacity-50" href={pageHref(Math.min(pageCount, currentPage + 1))}>next</Link>
                    <Link className="px-2 py-1 border border-white aria-disabled:opacity-50" href={pageHref(pageCount)}>»</Link>
                </div>
            </div>
        </>
    );
}



