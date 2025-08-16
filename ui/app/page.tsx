import { fetchBlacklistData } from '../lib/hasura';
import PageContent from '../components/PageContent';
import { notFound } from 'next/navigation';

export default async function HomePage() {
    const data = await fetchBlacklistData({ pageUsdt: 1, pageUsdc: 1, pageSize: 20, sortUsdt: 'desc', sortUsdc: 'desc' });
    return <PageContent selectedTab="usdt" data={data} currentPage={1} sort={'desc'} />;
}


