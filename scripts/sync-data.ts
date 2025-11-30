import 'dotenv/config';
import { db } from '../src/lib/db/client';
import { brands, cards, brandCards } from '../src/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

// Types
type TCNBrand = {
    name: string;
    url: string;
};

type TCNResponse = {
    response: {
        brand: {
            brand_name: string;
        }[];
    };
};

function toTitleCase(str: string) {
    return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

// Helper to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

async function syncTCN() {
    console.time('SyncTCN');
    console.log('Syncing TCN data...');
    const tcnDataPath = path.join(process.cwd(), 'data', 'tcn.json');
    const tcnBrands: TCNBrand[] = JSON.parse(fs.readFileSync(tcnDataPath, 'utf-8'));

    const results = await Promise.all(tcnBrands.map(async (brand) => {
        console.time(`Process ${brand.name}`);
        console.log(`Fetching ${brand.name}...`);
        try {
            const response = await fetch(brand.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch ${brand.name}: ${response.statusText}`);
            }
            const data: TCNResponse = await response.json();
            const cardName = `${brand.name} (TCN)`; // e.g. "Active (TCN)"

            console.log(`[${brand.name}] Inserting card...`);
            // Ensure card exists
            await db.insert(cards).values({ name: cardName }).onConflictDoNothing();

            const retailerNames = data.response.brand.map((r) => toTitleCase(r.brand_name));
            console.log(`[${brand.name}] Found ${retailerNames.length} retailers. Processing...`);

            // Bulk insert brands
            const uniqueRetailers = Array.from(new Set(retailerNames));
            const brandChunks = chunkArray(uniqueRetailers, 50);
            for (const chunk of brandChunks) {
                await db.insert(brands).values(chunk.map(name => ({ name }))).onConflictDoNothing();
            }

            // Bulk insert brandCards
            const brandCardValues = uniqueRetailers.map(retailerName => ({
                brandName: retailerName,
                cardName: cardName,
                source: 'tcn',
                lastUpdatedAt: new Date(),
            }));

            const linkChunks = chunkArray(brandCardValues, 50);
            for (const chunk of linkChunks) {
                await db.insert(brandCards).values(chunk).onConflictDoUpdate({
                    target: [brandCards.brandName, brandCards.cardName],
                    set: { lastUpdatedAt: new Date(), deletedAt: null, source: 'tcn' }
                });
            }

            console.log(`[${brand.name}] Soft deleting old links...`);
            await db.update(brandCards)
                .set({ deletedAt: new Date() })
                .where(
                    eq(brandCards.cardName, cardName)
                );

            console.timeEnd(`Process ${brand.name}`);
            return true;
        } catch (error) {
            console.error(`Error processing ${brand.name}:`, error);
            console.timeEnd(`Process ${brand.name}`);
            return false;
        }
    }));

    if (results.some(success => !success)) {
        throw new Error('One or more TCN brands failed to sync');
    }
    console.timeEnd('SyncTCN');
}

async function syncUltimate() {
    console.time('SyncUltimate');
    console.log('Syncing Ultimate data...');
    const ultimateHtmlPath = path.join(process.cwd(), 'data', 'ultimate', 'all-retailers.html');
    const html = fs.readFileSync(ultimateHtmlPath, 'utf-8');
    const $ = cheerio.load(html);

    const items = $('.blockContent_brands--item');

    // Map of card class name to display name
    // Based on README:
    // - Birthday -> birthday
    // - Thank You -> thank-you
    // ...
    // We need a mapping or just use the class name as ID and format it for display?
    // The README lists cards: "Birthday", "Thank You", etc.
    // And HTML classes: "birthday", "thank-you", etc.
    // So we can normalize.

    const cardMapping: Record<string, string> = {
        'birthday': 'Birthday',
        'thank-you': 'Thank You',
        'celebrate': 'Celebrate',
        'just-for-you': 'Just For You',
        'everyone': 'Everyone',
        'him': 'Him',
        'her': 'Her',
        'home': 'Home',
        'kids': 'Kids',
        'teens': 'Teens',
        'students': 'Students',
        'baby-mum': 'Baby & Mum', // "Baby & Mum" -> baby-mum? README says "Baby & Mum". HTML might be "baby-mum".
        'shopping': 'Shopping',
        'active-wellness': 'Active & Wellness',
        'eats': 'Eats',
        'gaming-bites': 'Gaming & Bites',
        'beauty-spa': 'Beauty & Spa',
        'thanks': 'Thanks'
    };
    // Note: README says "Baby & Mum", "Active & Wellness", "Gaming & Bites", "Beauty & Spa".
    // HTML example: "gaming-bites".
    // So we need to handle these mappings.

    const timestamp = new Date();

    items.each((_, element) => {
        const el = $(element);
        const brandName = el.attr('data-title');
        const classes = el.attr('class') || '';
        const classList = classes.split(' ');

        if (brandName) {
            // Ensure brand exists
            // We can't await inside each sync, so we should collect data first.
        }
    });

    // Let's collect all data first
    const updates: { brandName: string; cardNames: string[] }[] = [];

    items.each((_, element) => {
        const el = $(element);
        const brandName = el.attr('data-title');
        if (!brandName) return;

        const classes = el.attr('class') || '';
        const classList = classes.split(' ').filter(c =>
            !['col-12', 'blockContent_brands--item', 'has-overlay', 'in-store', 'online', 'exchange-card'].includes(c)
        );

        // The remaining classes should be cards.
        // We need to match them to our known cards list or just accept them.
        // README says: "The following list is all the cards from Ultimate Gift cards"
        // So we should probably filter by that list.

        const validCards = Object.keys(cardMapping);
        const mappedCardNames: string[] = [];
        for (const cls of classList) {
            if (cardMapping[cls]) {
                mappedCardNames.push(cardMapping[cls]);
            }
        }

        if (mappedCardNames.length > 0) {
            updates.push({ brandName, cardNames: mappedCardNames });
        }
    });

    console.log(`Found ${updates.length} brands to update in Ultimate.`);
    console.time('UltimateDBUpdates');

    // 1. Bulk Insert Brands
    const allBrandNames = Array.from(new Set(updates.map(u => u.brandName)));
    console.log(`Inserting ${allBrandNames.length} unique brands...`);
    const brandChunks = chunkArray(allBrandNames, 50);
    for (const chunk of brandChunks) {
        await db.insert(brands).values(chunk.map(name => ({ name }))).onConflictDoNothing();
    }

    // 2. Bulk Insert Cards (and prepare brandCards)
    const allCardNames = new Set<string>();
    const allBrandCards: { brandName: string; cardName: string; source: string; lastUpdatedAt: Date }[] = [];

    for (const update of updates) {
        for (const rawCardName of update.cardNames) {
            const cardName = `${rawCardName} (Ultimate)`;
            allCardNames.add(cardName);
            allBrandCards.push({
                brandName: update.brandName,
                cardName: cardName,
                source: 'ultimate',
                lastUpdatedAt: timestamp,
            });
        }
    }

    console.log(`Inserting ${allCardNames.size} unique cards...`);
    const cardChunks = chunkArray(Array.from(allCardNames), 50);
    for (const chunk of cardChunks) {
        await db.insert(cards).values(chunk.map(name => ({ name }))).onConflictDoNothing();
    }

    // 3. Bulk Insert BrandCards
    console.log(`Inserting/Updating ${allBrandCards.length} brand-card links...`);
    const linkChunks = chunkArray(allBrandCards, 50);
    let processedCount = 0;
    for (const chunk of linkChunks) {
        await db.insert(brandCards).values(chunk).onConflictDoUpdate({
            target: [brandCards.brandName, brandCards.cardName],
            set: { lastUpdatedAt: timestamp, deletedAt: null, source: 'ultimate' }
        });
        processedCount += chunk.length;
        if (processedCount % 500 === 0) {
            console.log(`Processed ${processedCount}/${allBrandCards.length} links...`);
        }
    }

    console.timeEnd('UltimateDBUpdates');

    // Soft delete logic for Ultimate?
    // It's harder because we iterate by brand in HTML, but we want to know if a brand was REMOVED from a card.
    // We can do it by card.
    // For each card type in Ultimate, we can see which brands are associated with it in this run.
    // Then delete others.

    // Group by card
    const cardsToBrands: Record<string, string[]> = {};
    for (const update of updates) {
        for (const cardName of update.cardNames) {
            if (!cardsToBrands[cardName]) cardsToBrands[cardName] = [];
            cardsToBrands[cardName].push(update.brandName);
        }
    }

    for (const [cardName, brandNames] of Object.entries(cardsToBrands)) {
        // Update deletedAt for this card where brandName is NOT in brandNames
        // AND the brand was previously associated with this card (and source is Ultimate? We don't track source...)
        // Wait, if we share cards between TCN and Ultimate, we might overwrite/delete each other's data if we are not careful.
        // TCN cards: Active, Baby, Dad, ...
        // Ultimate cards: Birthday, Thank You, ...
        // Some might overlap? "Active", "Her", "Him", "Home", "Kids", "Teen"/"Teens".
        // TCN: "Teen". Ultimate: "Teens".
        // TCN: "Active". Ultimate: "Active & Wellness"? Or just "active"?
        // HTML example: "her active teens students him kids everyone"
        // So "active" is a class.
        // README says "Active & Wellness" in the list.
        // But the HTML class is "active"? Or "active-wellness"?
        // Example 2: "gaming-bites". List: "Gaming & Bites".
        // Example 1: "active".
        // If TCN has "Active" and Ultimate has "Active" (via class "active"), they might be the same card.
        // If so, we need to be careful about soft deletes.
        // If TCN update runs, it updates "Active". If Ultimate update runs, it updates "Active".
        // If we soft delete in TCN run, we might delete Ultimate brands if I delete everything for "Her" that wasn't updated.
        // So I definitely need `source` or separate tables, or just be careful.
        // I'll add `source` to the schema. It's a safe bet.
    }
    console.timeEnd('SyncUltimate');
}

async function main() {
    let hasError = false;

    try {
        await syncTCN();
    } catch (e) {
        console.error('Error in syncTCN:', e);
        hasError = true;
    }

    try {
        await syncUltimate();
    } catch (e) {
        console.error('Error in syncUltimate:', e);
        hasError = true;
    }

    if (hasError) {
        console.error('Sync completed with errors.');
        process.exit(1);
    } else {
        console.log('Sync completed successfully.');
    }
}

main().catch((e) => {
    console.error('Unhandled error in main:', e);
    process.exit(1);
});
