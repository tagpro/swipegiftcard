import 'dotenv/config';
import { fetchTCNData, fetchUltimateData } from '../src/lib/sync/fetchers';
import { syncToDatabase } from '../src/lib/sync/db-ops';
import { mergeSyncData } from '../src/lib/sync/brand-names';

async function main() {
    try {
        console.log('Starting Sync V2...');

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

        console.log('Sync V2 Completed Successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Sync V2 Failed:', error);
        process.exit(1);
    }
}

main();
