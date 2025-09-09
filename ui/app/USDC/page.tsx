import { fetchBlacklistData } from '../../lib/hasura';
import PageContent from '../../components/PageContent';
import { redirect } from 'next/navigation';

export default async function USDCTabPage({ searchParams }: { searchParams?: { page?: string; sort?: string; sortBy?: string } }) {
    const page = Math.max(1, Number(searchParams?.page ?? '1')) || 1;
    const sort = (searchParams?.sort === 'asc' || searchParams?.sort === 'desc') ? searchParams?.sort : 'desc';
    const sortBy = searchParams?.sortBy === 'date' ? 'date' : 'balance';
    const data = await fetchBlacklistData({ pageUsdt: 1, pageUsdc: page, pageUsd1: 1, pageRlusd: 1, pageSize: 20, sortUsdt: 'desc', sortUsdc: sort as 'asc' | 'desc', sortUsd1: 'desc', sortRlusd: 'desc', sortByUsdc: sortBy });
    const totalPages = data.pageCountUsdc;
    if (page > totalPages) {
        redirect(`/USDC?page=${totalPages}&sort=${sort}`);
    }
    return <PageContent selectedTab="usdc" data={data} currentPage={page} sort={sort as 'asc' | 'desc'} sortBy={sortBy} />;
}
