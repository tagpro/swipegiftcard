import { json } from '@sveltejs/kit';
import { db } from '$lib/db/client';
import { brands, cards, brandCards } from '$lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    // Only brands with at least one active link. Renamed or removed brands keep their
    // row (and soft-deleted links) in the DB, but shouldn't reach clients.
    const activeBrands = await db
        .select()
        .from(brands)
        .where(sql`exists (select 1 from ${brandCards} where ${brandCards.brandName} = ${brands.name} and ${brandCards.deletedAt} is null)`);
    const allCards = await db.select().from(cards);
    const allBrandCards = await db.select().from(brandCards);

    return json({
        brands: activeBrands,
        cards: allCards,
        brandCards: allBrandCards
    });
}
