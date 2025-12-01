import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTCNData, fetchUltimateData } from '../src/lib/sync/fetchers';
import { syncToDatabase } from '../src/lib/sync/db-ops';
import { db } from '../src/lib/db/client';
import { brands, cards, brandCards } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

// Mock fetch
global.fetch = vi.fn();

// Mock DB
vi.mock('../src/lib/db/client', () => ({
    db: {
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                onConflictDoNothing: vi.fn(),
                onConflictDoUpdate: vi.fn()
            }))
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn()
            }))
        })),
        transaction: vi.fn((cb) => cb({
            insert: vi.fn(() => ({
                values: vi.fn(() => ({
                    onConflictDoNothing: vi.fn(),
                    onConflictDoUpdate: vi.fn()
                }))
            })),
            update: vi.fn(() => ({
                set: vi.fn(() => ({
                    where: vi.fn()
                }))
            }))
        }))
    }
}));

describe('Sync Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchTCNData', () => {
        it('should fetch and parse TCN data', async () => {
            // Mock file system for tcn.json
            vi.mock('fs', () => ({
                readFileSync: vi.fn(() => JSON.stringify([
                    { name: 'Test Brand', url: 'http://example.com' }
                ]))
            }));

            // Mock fetch response
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({
                    response: {
                        brand: [{ brand_name: 'Retailer 1' }, { brand_name: 'Retailer 2' }]
                    }
                })
            });

            const data = await fetchTCNData();
            expect(data.cards.has('Test Brand (TCN)')).toBe(true);
            expect(data.brands.has('Retailer 1')).toBe(true);
            expect(data.records.length).toBe(2);
        });
    });

    describe('syncToDatabase', () => {
        it('should insert brands, cards, and links', async () => {
            const data = {
                brands: new Set(['Brand A']),
                cards: new Set(['Card 1']),
                records: [{ brandName: 'Brand A', cardName: 'Card 1', source: 'tcn' as const }]
            };

            await syncToDatabase(data);

            expect(db.insert).toHaveBeenCalledTimes(3); // Brands, Cards, Links
            expect(db.update).toHaveBeenCalledTimes(1); // Soft delete
        });
    });
});
