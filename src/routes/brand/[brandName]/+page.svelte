<script lang="ts">
    import { page } from "$app/stores";
    import { brandCards, cards } from "$lib/client-db";
    import { useLiveQuery } from "@tanstack/svelte-db";

    const brandName = $page.params.brandName;

    // Query all brandCards and filter by brandName
    // Since TanStack DB might not support complex queries yet, we filter in JS.
    const brandCardsQuery = useLiveQuery(() => brandCards);

    let relatedCards = $derived.by(() => {
        const allBrandCards = brandCardsQuery.data || [];
        const filtered = allBrandCards.filter(
            (bc) => bc.brandName === brandName,
        );
        return filtered.map((bc) => ({
            name: bc.cardName,
            source: bc.source,
        }));
    });
</script>

<div class="max-w-4xl mx-auto p-6 mb-16">
    <div class="mb-8">
        <a
            href="/"
            class="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors"
        >
            <svg
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                ></path></svg
            >
            Back to Brands
        </a>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {brandName}
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
            Available on the following gift cards:
        </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {#each relatedCards as card}
            <a
                href="/card/{card.name}"
                class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border overflow-hidden hover:-translate-y-1 {card.source ===
                'tcn'
                    ? 'border-teal-200 dark:border-teal-900'
                    : card.source === 'ultimate'
                      ? 'border-amber-200 dark:border-amber-900'
                      : 'border-gray-100 dark:border-gray-700'}"
            >
                <div class="p-5">
                    <h3
                        class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors mb-1"
                    >
                        {card.name}
                    </h3>
                    <div
                        class="flex items-center text-sm text-gray-500 dark:text-gray-400"
                    >
                        <span
                            class="px-2 py-1 rounded text-xs font-medium {card.source ===
                            'tcn'
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
                                : card.source === 'ultimate'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                  : 'bg-gray-100 dark:bg-gray-700'}"
                        >
                            {card.source === "tcn"
                                ? "TCN"
                                : card.source === "ultimate"
                                  ? "Ultimate"
                                  : card.source}
                        </span>
                    </div>
                </div>
            </a>
        {/each}
    </div>

    {#if relatedCards.length === 0}
        <div
            class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700"
        >
            <p class="text-gray-500 dark:text-gray-400">
                No cards found for this brand.
            </p>
        </div>
    {/if}
</div>
