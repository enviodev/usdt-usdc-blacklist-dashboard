import { fetchBlacklistData } from '../../lib/hasura';
import PageContent from '../../components/PageContent';
import { redirect } from 'next/navigation';

export default async function RLUSDTabPage({ searchParams }: { searchParams?: { page?: string; sort?: string; sortBy?: string } }) {
    const page = Math.max(1, Number(searchParams?.page ?? '1')) || 1;
    const sort = (searchParams?.sort === 'asc' || searchParams?.sort === 'desc') ? searchParams?.sort : 'desc';
    const sortBy = searchParams?.sortBy === 'date' ? 'date' : 'balance';
    const data = await fetchBlacklistData({ pageUsdt: 1, pageUsdc: 1, pageUsd1: 1, pageRlusd: page, pageSize: 20, sortRlusd: sort as 'asc' | 'desc', sortUsdt: 'desc', sortUsdc: 'desc', sortUsd1: 'desc', sortByRlusd: sortBy });
    const totalPages = data.pageCountRlusd;
    if (page > totalPages) {
        redirect(`/RLUSD?page=${totalPages}&sort=${sort}`);
    }
    return <PageContent selectedTab="rlusd" data={data} currentPage={page} sort={sort as 'asc' | 'desc'} sortBy={sortBy} />;
}


