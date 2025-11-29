import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const brands = sqliteTable('brands', {
    name: text('name').primaryKey()
});

export const cards = sqliteTable('cards', {
    name: text('name').primaryKey()
});

export const brandCards = sqliteTable('brand_cards', {
    brandName: text('brand_name')
        .notNull()
        .references(() => brands.name),
    cardName: text('card_name')
        .notNull()
        .references(() => cards.name),
    source: text('source').notNull(), // 'tcn' or 'ultimate'
    lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' })
}, (t) => ({
    pk: primaryKey({ columns: [t.brandName, t.cardName] })
}));
