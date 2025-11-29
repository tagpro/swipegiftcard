import { json } from '@sveltejs/kit';
import { db } from '$lib/db/client';
import { brands, cards, brandCards } from '$lib/db/schema';

export async function GET() {
    const allBrands = await db.select().from(brands);
    const allCards = await db.select().from(cards);
    const allBrandCards = await db.select().from(brandCards);

    return json({
        brands: allBrands,
        cards: allCards,
        brandCards: allBrandCards
    });
}
