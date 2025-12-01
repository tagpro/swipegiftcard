export interface SyncRecord {
    brandName: string;
    cardName: string;
    source: 'tcn' | 'ultimate';
}

export interface SyncData {
    brands: Set<string>;
    cards: Set<string>;
    records: SyncRecord[];
}

export type TCNBrand = {
    name: string;
    url: string;
};

export type TCNResponse = {
    response: {
        brand: {
            brand_name: string;
        }[];
    };
};
