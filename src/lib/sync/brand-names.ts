import type { SyncData, SyncRecord } from './types';

// Named entities seen in provider data. Numeric entities (&#039;, &#8217;) are handled generically.
const NAMED_ENTITIES: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    rsquo: '’',
    lsquo: '‘',
    rdquo: '”',
    ldquo: '“',
    ndash: '–',
    mdash: '—',
    middot: '·',
    eacute: 'é',
    iuml: 'ï'
};

// Provider entries that are not real retailers
const IGNORED_NAMES = [/^tcn\s*internal/i];

/**
 * Decodes HTML character references such as `&amp;`, `&#039;` and `&#x27;`.
 * Runs until stable so double-encoded values (`&amp;amp;`) are fully decoded.
 */
export function decodeHtmlEntities(str: string): string {
    let previous: string;
    let current = str;
    do {
        previous = current;
        current = current.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, entity: string) => {
            if (entity[0] === '#') {
                const code = entity[1] === 'x' || entity[1] === 'X'
                    ? parseInt(entity.slice(2), 16)
                    : parseInt(entity.slice(1), 10);
                return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
            }
            return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
        });
    } while (current !== previous);
    return current;
}

/**
 * Cleans a raw provider brand name for display: decodes HTML entities, normalises
 * whitespace, and turns stylised all-caps words of 5+ letters into title case
 * (`DECJUBA` -> `Decjuba`, `KOOKAÏ` -> `Kookaï`). Shorter all-caps words are kept
 * as they are almost always acronyms (`ASOS`, `BCF`, `TK Maxx`, `JB Hi-Fi`, `T2`).
 * Returns null for names that should be dropped.
 */
export function cleanBrandName(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const name = decodeHtmlEntities(raw)
        .normalize('NFC')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(
            /(?<![\p{L}\p{N}])\p{Lu}{5,}(?![\p{L}\p{N}])/gu,
            (word) => word.charAt(0) + word.slice(1).toLowerCase()
        );
    if (!name || IGNORED_NAMES.some((pattern) => pattern.test(name))) return null;
    return name;
}

/**
 * Key used to recognise the same retailer across sources. Ignores case, accents,
 * spacing and punctuation, so `Nine West`/`Ninewest`, `Kikki K`/`Kikki.k`,
 * `MAC`/`M·A·C` and `Estee Lauder`/`Estée Lauder` all match.
 */
export function brandKey(name: string): string {
    return name
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^\p{L}\p{N}]/gu, '');
}

function countMatches(str: string, pattern: RegExp): number {
    return str.match(pattern)?.length ?? 0;
}

/**
 * Orders name variants so the best display name comes first. Independent of
 * input order, so the chosen name is stable between syncs. Prefers, in order:
 * separate words (`Nine West`), accented letters (`Estée Lauder`), less
 * punctuation (`MAC` over `M·A·C`), more capitals (`AllKinds` over `Allkinds`).
 */
function compareDisplayNames(a: string, b: string): number {
    const score = (s: string) => [
        countMatches(s, / /g),
        countMatches(s.normalize('NFD'), /\p{M}/gu),
        -countMatches(s, /[^\p{L}\p{N} ]/gu),
        countMatches(s, /\p{Lu}/gu)
    ];
    const sa = score(a);
    const sb = score(b);
    for (let i = 0; i < sa.length; i++) {
        if (sa[i] !== sb[i]) return sb[i] - sa[i];
    }
    return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Maps every raw name to its canonical display name. Names that clean to the
 * same `brandKey` share one display name; dropped names map to null.
 */
export function buildCanonicalNames(rawNames: Iterable<string>): Map<string, string | null> {
    const variantsByKey = new Map<string, Set<string>>();
    const cleaned = new Map<string, string | null>();

    for (const raw of rawNames) {
        if (cleaned.has(raw)) continue;
        const name = cleanBrandName(raw);
        cleaned.set(raw, name);
        if (!name) continue;
        const key = brandKey(name);
        if (!variantsByKey.has(key)) variantsByKey.set(key, new Set());
        variantsByKey.get(key)!.add(name);
    }

    const displayByKey = new Map<string, string>();
    for (const [key, variants] of variantsByKey) {
        displayByKey.set(key, [...variants].sort(compareDisplayNames)[0]);
    }

    const canonical = new Map<string, string | null>();
    for (const [raw, name] of cleaned) {
        canonical.set(raw, name ? displayByKey.get(brandKey(name))! : null);
    }
    return canonical;
}

/**
 * Merges data from several sources, reconciling brand names so each retailer
 * is stored once under a single display name, and removing duplicate links.
 */
export function mergeSyncData(...sources: SyncData[]): SyncData {
    const allRecords = sources.flatMap((s) => s.records);
    const canonical = buildCanonicalNames([
        ...sources.flatMap((s) => [...s.brands]),
        ...allRecords.map((r) => r.brandName)
    ]);

    const brands = new Set<string>();
    const cards = new Set<string>();
    const records: SyncRecord[] = [];
    const seenLinks = new Set<string>();

    for (const source of sources) {
        for (const card of source.cards) cards.add(card);
        for (const raw of source.brands) {
            const name = canonical.get(raw);
            if (name) brands.add(name);
        }
    }

    for (const record of allRecords) {
        const brandName = canonical.get(record.brandName);
        if (!brandName) continue;
        const linkKey = `${brandName}\u0000${record.cardName}`;
        if (seenLinks.has(linkKey)) continue;
        seenLinks.add(linkKey);
        brands.add(brandName);
        records.push({ ...record, brandName });
    }

    return { brands, cards, records };
}
