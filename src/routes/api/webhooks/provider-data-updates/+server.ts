import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { fetchTCNData, fetchUltimateData } from '$lib/sync/fetchers';
import { syncToDatabase } from '$lib/sync/db-ops';
import { mergeSyncData } from '$lib/sync/brand-names';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    // Check for secret key
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('Starting API-triggered Sync...');

        // 1. Fetch Data
        const [tcnData, ultimateData] = await Promise.all([
            fetchTCNData(),
            fetchUltimateData()
        ]);

        // 2. Merge Data (reconciles brand names across sources)
        const mergedData = mergeSyncData(tcnData, ultimateData);

        console.log(`Merged Data: ${mergedData.brands.size} brands, ${mergedData.cards.size} cards, ${mergedData.records.length} links.`);

        // 3. Sync to Database
        await syncToDatabase(mergedData);

        console.log('API-triggered Sync Completed Successfully.');
        return json({ success: true, message: 'Sync completed successfully' });

    } catch (error: any) {
        console.error('API-triggered Sync Failed:', error);
        return json({ error: 'Sync failed', details: error.message }, { status: 500 });
    }
};
