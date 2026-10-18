import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fetchUltimateData } from '../src/lib/sync/fetchers';

global.fetch = vi.fn();

function mockPage(html: string) {
    (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => html
    });
}

const filters = `
    <div class="inner button-group" data-filter-group="type">
        <button class=" is-checked" data-filter=""><span>All</span></button>
        <button class="" data-filter=".online"><span>Online</span></button>
        <button class="" data-filter=".exchange-card"><span>Exchange for eGift</span></button>
    </div>
    <div class="button-group filter-by-button-group" data-filter-group="product">
        <button class=" is-checked" data-filter="">All</button>
        <button class="" data-filter=".style">Shopping</button>
        <button class="" data-filter=".baby-mum">Baby &#038; Mum</button>
    </div>`;

describe('fetchUltimateData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('reads card types from the product filters', async () => {
        mockPage(`${filters}
            <div class="col-12 blockContent_brands--item has-overlay style online exchange-card" data-title="ASOS"></div>
            <div class="col-12 blockContent_brands--item has-overlay style baby-mum" data-title="Bonds"></div>`);

        const data = await fetchUltimateData();

        expect([...data.cards].sort()).toEqual(['Baby & Mum (Ultimate)', 'Shopping (Ultimate)']);
        expect([...data.brands].sort()).toEqual(['ASOS', 'Bonds']);
        expect(data.records).toHaveLength(3);
    });

    it('throws instead of returning nothing when the filters are missing', async () => {
        mockPage('<div class="blockContent_brands--item style" data-title="ASOS"></div>');

        await expect(fetchUltimateData()).rejects.toThrow('no card types found');
    });

    it('finds all 18 cards in the saved retailers page', async () => {
        const snapshot = path.join(process.cwd(), 'data/ultimate/all-retailers.html');
        mockPage(fs.readFileSync(snapshot, 'utf-8'));

        const data = await fetchUltimateData();

        expect(data.cards.size).toBe(18);
        expect(data.cards.has('Shopping (Ultimate)')).toBe(true);
        expect(data.cards.has('Active & Wellness (Ultimate)')).toBe(true);
    });
});
