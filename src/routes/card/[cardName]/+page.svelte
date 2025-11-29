<script lang="ts">
    import { page } from "$app/stores";
    import { brandCards } from "$lib/client-db";
    import { useLiveQuery } from "@tanstack/svelte-db";

    const cardName = $page.params.cardName;

    const brandCardsQuery = useLiveQuery(() => brandCards);

    let relatedBrands = $derived.by(() => {
        const allBrandCards = brandCardsQuery.data || [];
        const filtered = allBrandCards.filter((bc) => bc.cardName === cardName);
        return filtered.map((bc) => ({
            name: bc.brandName,
            source: bc.source,
        }));
    });
</script>

<div class="max-w-4xl mx-auto p-6 mb-16">
    <div class="mb-8">
        <a
            href="/cards"
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
            Back to Cards
        </a>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {cardName} Card
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
            Participating brands for this card:
        </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {#each relatedBrands as brand}
            <a
                href="/brand/{brand.name}"
                class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 overflow-hidden hover:-translate-y-1"
            >
                <div class="p-5">
                    <h3
                        class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors mb-1"
                    >
                        {brand.name}
                    </h3>
                    <div
                        class="flex items-center text-sm text-gray-500 dark:text-gray-400"
                    >
                        <span
                            class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-medium"
                        >
                            {brand.source}
                        </span>
                    </div>
                </div>
            </a>
        {/each}
    </div>

    {#if relatedBrands.length === 0}
        <div
            class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700"
        >
            <p class="text-gray-500 dark:text-gray-400">
                No brands found for this card.
            </p>
        </div>
    {/if}
</div>
