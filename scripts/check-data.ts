import Database from 'better-sqlite3';

const db = new Database('local.db');
const brands = db.prepare("SELECT count(*) as count FROM brands").get();
const cards = db.prepare("SELECT count(*) as count FROM cards").get();
const brandCards = db.prepare("SELECT count(*) as count FROM brand_cards").get();

console.log('Brands:', brands);
console.log('Cards:', cards);
console.log('BrandCards:', brandCards);

const sample = db.prepare("SELECT * FROM brand_cards LIMIT 5").all();
console.log('Sample BrandCards:', sample);
