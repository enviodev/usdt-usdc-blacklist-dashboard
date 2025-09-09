import { fetchBlacklistData } from '../../lib/hasura';
import PageContent from '../../components/PageContent';
import { redirect } from 'next/navigation';

export default async function USD1TabPage({ searchParams }: { searchParams?: { page?: string; sort?: string; sortBy?: string } }) {
    const page = Math.max(1, Number(searchParams?.page ?? '1')) || 1;
    const sort = (searchParams?.sort === 'asc' || searchParams?.sort === 'desc') ? searchParams?.sort : 'desc';
    const sortBy = searchParams?.sortBy === 'date' ? 'date' : 'balance';
    const data = await fetchBlacklistData({ pageUsdt: 1, pageUsdc: 1, pageUsd1: page, pageRlusd: 1, pageSize: 20, sortUsd1: sort as 'asc' | 'desc', sortUsdt: 'desc', sortUsdc: 'desc', sortRlusd: 'desc', sortByUsd1: sortBy });
    const totalPages = data.pageCountUsd1;
    if (page > totalPages) {
        redirect(`/USD1?page=${totalPages}&sort=${sort}`);
    }
    return <PageContent selectedTab="usd1" data={data} currentPage={page} sort={sort as 'asc' | 'desc'} sortBy={sortBy} />;
}


