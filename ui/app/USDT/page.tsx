import { fetchBlacklistData } from '../../lib/hasura';
import PageContent from '../../components/PageContent';
import { redirect } from 'next/navigation';

export default async function USDTTabPage({ searchParams }: { searchParams?: { page?: string; sort?: string } }) {
    const page = Math.max(1, Number(searchParams?.page ?? '1')) || 1;
    const sort = (searchParams?.sort === 'asc' || searchParams?.sort === 'desc') ? searchParams?.sort : 'desc';
    const data = await fetchBlacklistData({ pageUsdt: page, pageUsdc: 1, pageSize: 20, sortUsdt: sort as 'asc' | 'desc', sortUsdc: 'desc' });
    const totalPages = data.pageCountUsdt;
    if (page > totalPages) {
        redirect(`/USDT?page=${totalPages}&sort=${sort}`);
    }
    return <PageContent selectedTab="usdt" data={data} currentPage={page} sort={sort as 'asc' | 'desc'} />;
}
