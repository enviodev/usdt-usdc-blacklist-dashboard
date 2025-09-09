import { fetchBlacklistData } from '../lib/hasura';
import PageContent from '../components/PageContent';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const data = await fetchBlacklistData({ pageUsdt: 1, pageUsdc: 1, pageUsd1: 1, pageRlusd: 1, pageSize: 20, sortUsdt: 'desc', sortUsdc: 'desc', sortUsd1: 'desc', sortRlusd: 'desc' });
    return <PageContent selectedTab="usdt" data={data} currentPage={1} sort={'desc'} />;
}


