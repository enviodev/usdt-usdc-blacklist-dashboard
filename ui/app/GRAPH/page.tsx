import { fetchSnapshotSeries, fetchBlacklistData } from '../../lib/hasura';
import PageContent from '../../components/PageContent';

export default async function GraphPage() {
    const data = await fetchBlacklistData({ pageUsdt: 1, pageUsdc: 1, pageUsd1: 1, pageRlusd: 1, pageSize: 20, sortUsdt: 'desc', sortUsdc: 'desc', sortUsd1: 'desc', sortRlusd: 'desc' });
    return (
        <PageContent selectedTab="graph" data={data} currentPage={1} sort={'desc'} />
    );
}


