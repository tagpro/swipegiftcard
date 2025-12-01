import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import type { SyncData, TCNBrand, TCNResponse, SyncRecord } from './types';

// Helper to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

function toTitleCase(str: string) {
    return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

export async function fetchTCNData(): Promise<SyncData> {
    console.log('Fetching TCN data...');
    const tcnDataPath = path.join(process.cwd(), 'data', 'tcn.json');
    const tcnBrands: TCNBrand[] = JSON.parse(fs.readFileSync(tcnDataPath, 'utf-8'));

    const brands = new Set<string>();
    const cards = new Set<string>();
    const records: SyncRecord[] = [];

    // Process in chunks to avoid rate limiting
    const brandChunks = chunkArray(tcnBrands, 3);

    for (let i = 0; i < brandChunks.length; i++) {
        const chunk = brandChunks[i];
        console.log(`Processing TCN chunk ${i + 1}/${brandChunks.length} (${chunk.length} brands)...`);

        await Promise.all(chunk.map(async (brand) => {
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    const response = await fetch(brand.url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });

                    if (response.status === 403) {
                        throw new Error('Forbidden (Rate Limited)');
                    }

                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${brand.name}: ${response.statusText}`);
                    }

                    const data: TCNResponse = await response.json();
                    const cardName = `${brand.name} (TCN)`;
                    cards.add(cardName);

                    const retailerNames = data.response.brand.map((r) => toTitleCase(r.brand_name));
                    console.log(`[TCN] Fetched ${brand.name}: Found ${retailerNames.length} retailers.`);

                    for (const retailer of retailerNames) {
                        brands.add(retailer);
                        records.push({
                            brandName: retailer,
                            cardName: cardName,
                            source: 'tcn'
                        });
                    }
                    return; // Success

                } catch (error: any) {
                    attempts++;
                    console.error(`[TCN] Error fetching ${brand.name} (Attempt ${attempts}/${maxAttempts}):`, error.message);
                    if (attempts < maxAttempts) {
                        const waitTime = 2000 * Math.pow(2, attempts - 1);
                        console.log(`[TCN] Waiting ${waitTime}ms before retrying ${brand.name}...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                }
            }
            console.error(`[TCN] Failed to fetch ${brand.name} after ${maxAttempts} attempts.`);
        }));
        // Delay between chunks
        if (i < brandChunks.length - 1) {
            console.log('Waiting 2s before next chunk...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    return { brands, cards, records };
}

export async function fetchUltimateData(): Promise<SyncData> {
    console.log('Fetching Ultimate data...');
    const ultimateHtmlPath = path.join(process.cwd(), 'data', 'ultimate', 'all-retailers.html');
    const html = fs.readFileSync(ultimateHtmlPath, 'utf-8');
    const $ = cheerio.load(html);

    const brands = new Set<string>();
    const cards = new Set<string>();
    const records: SyncRecord[] = [];

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
        'baby-mum': 'Baby & Mum',
        'shopping': 'Shopping',
        'active-wellness': 'Active & Wellness',
        'eats': 'Eats',
        'gaming-bites': 'Gaming & Bites',
        'beauty-spa': 'Beauty & Spa',
        'thanks': 'Thanks'
    };

    const items = $('.blockContent_brands--item');
    console.log(`[Ultimate] Found ${items.length} brand items in HTML.`);

    items.each((_, element) => {
        const el = $(element);
        const brandName = el.attr('data-title');
        if (!brandName) return;

        brands.add(brandName);

        const classes = el.attr('class') || '';
        const classList = classes.split(' ');

        for (const cls of classList) {
            if (cardMapping[cls]) {
                const cardName = `${cardMapping[cls]} (Ultimate)`;
                cards.add(cardName);
                records.push({
                    brandName: brandName,
                    cardName: cardName,
                    source: 'ultimate'
                });
            }
        }
    });

    return { brands, cards, records };
}
