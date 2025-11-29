<script lang="ts">
    import { brands } from "$lib/client-db";
    import SwipeCard from "$lib/components/SwipeCard.svelte";
    import { useLiveQuery } from "@tanstack/svelte-db";

    const brandsQuery = useLiveQuery(() => brands);
    let allBrands = $derived(brandsQuery.data || []);

    // Shuffle brands for discovery
    let shuffledBrands = $derived(
        [...allBrands].sort(() => Math.random() - 0.5),
    );

    function handleSwipeLeft(item: any) {
        console.log("Swiped Left:", item.name);
    }

    function handleSwipeRight(item: any) {
        console.log("Swiped Right:", item.name);
        // Maybe add to favorites?
    }
</script>

<div class="p-4 mb-16">
    <h1 class="text-2xl font-bold mb-4 text-center">Discover Brands</h1>

    {#if allBrands.length > 0}
        <SwipeCard
            items={shuffledBrands}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
        />
    {:else}
        <p class="text-center mt-8">Loading brands or no data...</p>
        <div class="text-center mt-4">
            <a href="/sync" class="text-blue-500 underline">Go to Sync</a>
        </div>
    {/if}
</div>
