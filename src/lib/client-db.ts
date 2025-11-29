import { createCollection, localStorageCollectionOptions } from '@tanstack/db';

export type Brand = {
    name: string;
};

export type Card = {
    name: string;
};

export type BrandCard = {
    id: string; // brandName + '_' + cardName
    brandName: string;
    cardName: string;
    source: string;
    lastUpdatedAt: Date;
    deletedAt: Date | null;
};

export const brands = createCollection<Brand, string>(
    localStorageCollectionOptions({
        storageKey: 'brands',
        getKey: (brand) => brand.name,
    })
);

export const cards = createCollection<Card, string>(
    localStorageCollectionOptions({
        storageKey: 'cards',
        getKey: (card) => card.name,
    })
);

export const brandCards = createCollection<BrandCard, string>(
    localStorageCollectionOptions({
        storageKey: 'brandCards',
        getKey: (bc) => bc.id,
    })
);

export const clientDb = {
    tables: {
        brands,
        cards,
        brandCards
    }
};
