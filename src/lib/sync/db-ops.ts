import { db } from '../db/client';
import { brands, cards, brandCards } from '../db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import type { SyncData } from './types';

// Helper to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

export async function syncToDatabase(data: SyncData) {
    console.log('Starting database sync...');
    const startTime = new Date();

    // Note: better-sqlite3 transactions are synchronous, but we need async for DB calls.
    // For now, we will run without a transaction wrapper or we need to use a different driver.
    // Since this is a script, we can just run sequentially.

    // 1. Bulk Insert Brands
    const brandList = Array.from(data.brands);
    console.log(`Inserting ${brandList.length} brands...`);
    const brandChunks = chunkArray(brandList, 50);
    for (const chunk of brandChunks) {
        await db.insert(brands).values(chunk.map(name => ({ name }))).onConflictDoNothing();
    }

    // 2. Bulk Insert Cards
    const cardList = Array.from(data.cards);
    console.log(`Inserting ${cardList.length} cards...`);
    const cardChunks = chunkArray(cardList, 50);
    for (const chunk of cardChunks) {
        await db.insert(cards).values(chunk.map(name => ({ name }))).onConflictDoNothing();
    }

    // 3. Bulk Insert/Update BrandCards
    console.log(`Inserting/Updating ${data.records.length} brand-card links...`);
    const recordChunks = chunkArray(data.records, 50);
    for (const chunk of recordChunks) {
        await db.insert(brandCards).values(chunk.map(r => ({
            ...r,
            lastUpdatedAt: startTime
        }))).onConflictDoUpdate({
            target: [brandCards.brandName, brandCards.cardName],
            set: {
                lastUpdatedAt: startTime,
                deletedAt: null,
                source: sql`excluded.source`
            }
        });
    }

    // 4. Soft Delete
    // Mark any record that wasn't updated in this run (lastUpdatedAt < startTime) as deleted
    console.log('Performing soft delete...');
    const result = await db.update(brandCards)
        .set({ deletedAt: startTime })
        .where(lt(brandCards.lastUpdatedAt, startTime))
        .returning(); // Return all fields

    // Note: returning() depends on driver support. LibSQL supports it.
    // If not supported, we can just log "Soft delete completed".
    // Let's assume it might not return count easily without `returning`.
    // We'll just log completion.
    console.log(`Soft delete completed. (Marked records older than ${startTime.toISOString()} as deleted)`);

    console.log('Database sync complete.');
}
