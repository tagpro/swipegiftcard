<script lang="ts">
    import { cards } from "$lib/client-db";
    import { useLiveQuery } from "@tanstack/svelte-db";

    const cardsQuery = useLiveQuery(() => cards);
    let allCards = $derived(cardsQuery.data || []);
</script>

<div class="max-w-4xl mx-auto p-6 mb-16">
    <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            All Cards
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
            Browse all available gift cards.
        </p>
    </div>

    <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
        {#each allCards as card}
            <a
                href="/card/{card.name}"
                class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border overflow-hidden hover:-translate-y-1 {card.name.includes(
                    '(TCN)',
                )
                    ? 'border-teal-200 dark:border-teal-900'
                    : card.name.includes('(Ultimate)')
                      ? 'border-amber-200 dark:border-amber-900'
                      : 'border-gray-100 dark:border-gray-700'}"
            >
                <div class="p-5">
                    <h3
                        class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors mb-1"
                    >
                        {card.name}
                    </h3>
                    <div class="flex items-center gap-2">
                        {#if card.name.includes("(TCN)")}
                            <span
                                class="px-2 py-0.5 rounded text-[10px] font-medium bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
                            >
                                TCN
                            </span>
                        {/if}
                        {#if card.name.includes("(Ultimate)")}
                            <span
                                class="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                            >
                                Ultimate
                            </span>
                        {/if}
                    </div>
                </div>
            </a>
        {/each}
    </div>

    {#if allCards.length === 0}
        <div class="text-center py-12">
            <p class="text-gray-500 dark:text-gray-400">
                No cards found. Try syncing data.
            </p>
        </div>
    {/if}
</div>
