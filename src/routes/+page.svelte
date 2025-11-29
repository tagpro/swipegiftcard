<script lang="ts">
    import { clientDb } from "$lib/client-db";
    import { useLiveQuery } from "@tanstack/svelte-db";

    let searchQuery = $state("");

    // This is a placeholder. TanStack DB query syntax might differ.
    // We want to filter brands by name.
    // Assuming we can filter in memory or via query.

    // For now, let's just list all brands and filter in JS if the DB doesn't support "contains".
    const brandsQuery = useLiveQuery(() => clientDb.tables.brands);

    let filteredBrands = $derived(
        (brandsQuery.data || []).filter((b) =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
</script>

<div class="max-w-4xl mx-auto p-6">
    <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Find Your Brand
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
            Search for brands to see eligible gift cards.
        </p>
    </div>

    <div class="relative mb-8">
        <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
            <svg
                class="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
            >
                <path
                    fill-rule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clip-rule="evenodd"
                />
            </svg>
        </div>
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search brands..."
            class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition duration-150 ease-in-out dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
    </div>

    <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
        {#each filteredBrands as brand}
            <a
                href="/brand/{brand.name}"
                class="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 overflow-hidden hover:-translate-y-1"
            >
                <div
                    class="h-24 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                >
                    <span
                        class="text-4xl font-bold text-white opacity-50 select-none"
                    >
                        {brand.name.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div class="p-4">
                    <h3
                        class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors truncate"
                    >
                        {brand.name}
                    </h3>
                </div>
            </a>
        {/each}
    </div>

    {#if filteredBrands.length === 0}
        <div class="text-center py-12">
            <p class="text-gray-500 dark:text-gray-400">
                No brands found matching "{searchQuery}"
            </p>
        </div>
    {/if}
</div>
