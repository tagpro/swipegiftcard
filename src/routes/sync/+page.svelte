<script lang="ts">
    import { brands, cards, brandCards } from "$lib/client-db";
    import { onMount } from "svelte";

    let status = $state("Idle");
    let progress = $state(0);
    let error = $state<string | null>(null);

    async function sync() {
        status = "Syncing...";
        progress = 0;
        error = null;

        try {
            const response = await fetch("/api/sync");
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const data = await response.json();

            // Clear existing data? Or upsert?
            // TanStack DB doesn't have clear() easily?
            // We can just upsert.

            // Ensure collections are ready
            await brands.stateWhenReady();
            await cards.stateWhenReady();
            await brandCards.stateWhenReady();

            // Brands
            status = "Syncing Brands...";
            for (const brand of data.brands) {
                if (!brands.state.has(brand.name)) {
                    await brands.insert(brand);
                }
            }

            // Cards
            status = "Syncing Cards...";
            for (const card of data.cards) {
                if (!cards.state.has(card.name)) {
                    await cards.insert(card);
                }
            }

            // BrandCards
            status = "Syncing Relationships...";
            for (const bc of data.brandCards) {
                const id = `${bc.brandName}_${bc.cardName}`;
                if (brandCards.state.has(id)) {
                    await brandCards.update(id, (draft) => {
                        Object.assign(draft, bc);
                    });
                } else {
                    await brandCards.insert({ ...bc, id });
                }
            }

            status = "Sync Complete!";
        } catch (e: any) {
            status = "Error";
            error = e.message;
            console.error(e);
        }
    }
    async function resetAndSync() {
        if (
            !confirm(
                "Are you sure you want to clear all local data and re-sync?",
            )
        )
            return;

        status = "Resetting...";
        progress = 0;
        error = null;

        try {
            // Ensure collections are ready
            await brands.stateWhenReady();
            await cards.stateWhenReady();
            await brandCards.stateWhenReady();

            // Clear all data
            const brandKeys = Array.from(brands.state.keys());
            if (brandKeys.length > 0) await brands.delete(brandKeys);

            const cardKeys = Array.from(cards.state.keys());
            if (cardKeys.length > 0) await cards.delete(cardKeys);

            const brandCardKeys = Array.from(brandCards.state.keys());
            if (brandCardKeys.length > 0)
                await brandCards.delete(brandCardKeys);

            // Trigger sync
            await sync();
        } catch (e: any) {
            status = "Error Resetting";
            error = e.message;
            console.error(e);
        }
    }
</script>

<div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Sync Data</h1>

    <div class="mb-4">
        <p>Status: {status}</p>
        {#if error}
            <p class="text-red-500">Error: {error}</p>
        {/if}
    </div>

    <div class="flex gap-4">
        <button
            onclick={sync}
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={status === "Syncing..." || status === "Resetting..."}
        >
            {status === "Syncing..." ? "Syncing..." : "Sync Now"}
        </button>

        <button
            onclick={resetAndSync}
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            disabled={status === "Syncing..." || status === "Resetting..."}
        >
            {status === "Resetting..." ? "Resetting..." : "Reset & Sync"}
        </button>
    </div>
</div>
