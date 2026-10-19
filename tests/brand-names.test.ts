import { describe, it, expect } from 'vitest';
import {
    decodeHtmlEntities,
    cleanBrandName,
    brandKey,
    buildCanonicalNames,
    mergeSyncData
} from '../src/lib/sync/brand-names';
import type { SyncData } from '../src/lib/sync/types';

describe('Brand name normalisation', () => {
    describe('decodeHtmlEntities', () => {
        it('should decode named and numeric entities', () => {
            expect(decodeHtmlEntities('H&amp;M')).toBe('H&M');
            expect(decodeHtmlEntities('Bed Bath N&#039; Table')).toBe("Bed Bath N' Table");
            expect(decodeHtmlEntities('Grill&#8217;d')).toBe('Grill’d');
            expect(decodeHtmlEntities('Ben &#x26; Jerry&rsquo;s')).toBe('Ben & Jerry’s');
        });

        it('should decode double-encoded and mis-cased entities', () => {
            expect(decodeHtmlEntities('Scotch &amp;amp; Soda')).toBe('Scotch & Soda');
            expect(decodeHtmlEntities('Scotch &Amp; Soda')).toBe('Scotch & Soda');
        });

        it('should leave unknown entities and plain ampersands alone', () => {
            expect(decodeHtmlEntities('Best&Less')).toBe('Best&Less');
            expect(decodeHtmlEntities('A &foo; B')).toBe('A &foo; B');
        });
    });

    describe('cleanBrandName', () => {
        it('should keep source casing for acronyms and mixed case', () => {
            for (const name of ['ASOS', 'BCF', 'TK Maxx', 'JB Hi-Fi', 'JD Sports', 'T2', 'iFly', 'MyHouse', 'adidas']) {
                expect(cleanBrandName(name)).toBe(name);
            }
        });

        it('should title-case stylised all-caps words of 5+ letters', () => {
            expect(cleanBrandName('DECJUBA')).toBe('Decjuba');
            expect(cleanBrandName('SHEIKE')).toBe('Sheike');
            expect(cleanBrandName('KOOKAÏ')).toBe('Kookaï');
            expect(cleanBrandName('KINGPIN')).toBe('Kingpin');
        });

        it('should decode entities and trim whitespace', () => {
            expect(cleanBrandName('Temple &amp; Webster')).toBe('Temple & Webster');
            expect(cleanBrandName('Collins Booksellers ')).toBe('Collins Booksellers');
            expect(cleanBrandName('  Hype  DC ')).toBe('Hype DC');
        });

        it('should drop empty and internal names', () => {
            expect(cleanBrandName(undefined)).toBeNull();
            expect(cleanBrandName('   ')).toBeNull();
            expect(cleanBrandName('TcnInternalMerchantProd')).toBeNull();
        });
    });

    describe('brandKey', () => {
        it('should match the same retailer written differently', () => {
            const pairs = [
                ['ASOS', 'Asos'],
                ['Nine West', 'Ninewest'],
                ['Kikki K', 'Kikki.k'],
                ['MAC', 'M·A·C'],
                ['Estee Lauder', 'Estée Lauder'],
                ['JB Hi-Fi', 'Jb Hi-fi'],
                ['H&M', 'H & M']
            ];
            for (const [a, b] of pairs) {
                expect(brandKey(a)).toBe(brandKey(b));
            }
        });

        it('should keep different retailers apart', () => {
            expect(brandKey('Cotton On')).not.toBe(brandKey('Cotton On Kids'));
            expect(brandKey('H&M')).not.toBe(brandKey('H&M - Instore'));
        });
    });

    describe('buildCanonicalNames', () => {
        it('should pick one display name per retailer regardless of order', () => {
            const names = ['Ninewest', 'Nine West', 'Estee Lauder', 'Estée Lauder', 'MAC', 'M·A·C', 'Allkinds', 'AllKinds', 'Kikki.k', 'Kikki K'];
            const expected: Record<string, string> = {
                Ninewest: 'Nine West',
                'Estee Lauder': 'Estée Lauder',
                'M·A·C': 'MAC',
                Allkinds: 'AllKinds',
                'Kikki.k': 'Kikki K'
            };
            for (const order of [names, [...names].reverse()]) {
                const canonical = buildCanonicalNames(order);
                for (const [raw, display] of Object.entries(expected)) {
                    expect(canonical.get(raw)).toBe(display);
                    expect(canonical.get(display)).toBe(display);
                }
            }
        });
    });

    describe('mergeSyncData', () => {
        it('should merge brands from both sources under one name', () => {
            const tcn: SyncData = {
                brands: new Set(['H&amp;M', 'Nine West', 'TcnInternalMerchantProd']),
                cards: new Set(['Shop (TCN)']),
                records: [
                    { brandName: 'H&amp;M', cardName: 'Shop (TCN)', source: 'tcn' },
                    { brandName: 'Nine West', cardName: 'Shop (TCN)', source: 'tcn' },
                    { brandName: 'TcnInternalMerchantProd', cardName: 'Shop (TCN)', source: 'tcn' }
                ]
            };
            const ultimate: SyncData = {
                brands: new Set(['H&M', 'Ninewest']),
                cards: new Set(['Her (Ultimate)']),
                records: [
                    { brandName: 'H&M', cardName: 'Her (Ultimate)', source: 'ultimate' },
                    { brandName: 'Ninewest', cardName: 'Her (Ultimate)', source: 'ultimate' },
                    { brandName: 'Ninewest', cardName: 'Her (Ultimate)', source: 'ultimate' }
                ]
            };

            const merged = mergeSyncData(tcn, ultimate);

            expect([...merged.brands].sort()).toEqual(['H&M', 'Nine West']);
            expect([...merged.cards].sort()).toEqual(['Her (Ultimate)', 'Shop (TCN)']);
            expect(merged.records).toEqual([
                { brandName: 'H&M', cardName: 'Shop (TCN)', source: 'tcn' },
                { brandName: 'Nine West', cardName: 'Shop (TCN)', source: 'tcn' },
                { brandName: 'H&M', cardName: 'Her (Ultimate)', source: 'ultimate' },
                { brandName: 'Nine West', cardName: 'Her (Ultimate)', source: 'ultimate' }
            ]);
        });
    });
});
