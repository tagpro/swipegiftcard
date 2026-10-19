<script lang="ts">
    import { brands, cards, brandCards } from "$lib/client-db";
    import { onMount } from "svelte";

    let status = $state("Idle");
    let progress = $state(0);
    let error = $state<string | null>(null);
    // Blocks both buttons until a sync or reset (including cleanup) finishes
    let busy = $state(false);

    async function sync() {
        if (busy) return;
        busy = true;
        try {
            await runSync();
        } finally {
            busy = false;
        }
    }

    // Collection writes return a Transaction; await isPersisted so failures surface
    async function runSync() {
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
                    await brands.insert(brand).isPersisted.promise;
                }
            }

            // Cards
            status = "Syncing Cards...";
            for (const card of data.cards) {
                if (!cards.state.has(card.name)) {
                    await cards.insert(card).isPersisted.promise;
                }
            }

            // BrandCards
            status = "Syncing Relationships...";
            for (const bc of data.brandCards) {
                const id = `${bc.brandName}_${bc.cardName}`;
                if (brandCards.state.has(id)) {
                    await brandCards.update(id, (draft) => {
                        Object.assign(draft, bc);
                    }).isPersisted.promise;
                } else {
                    await brandCards.insert({ ...bc, id }).isPersisted.promise;
                }
            }

            // Remove local rows the server no longer has (e.g. renamed brands)
            status = "Removing Stale Data...";
            const serverBrands = new Set(data.brands.map((b: any) => b.name));
            const staleBrands = Array.from(brands.state.keys()).filter(
                (key) => !serverBrands.has(key),
            );
            if (staleBrands.length > 0) await brands.delete(staleBrands).isPersisted.promise;

            const serverCards = new Set(data.cards.map((c: any) => c.name));
            const staleCards = Array.from(cards.state.keys()).filter(
                (key) => !serverCards.has(key),
            );
            if (staleCards.length > 0) await cards.delete(staleCards).isPersisted.promise;

            const serverBrandCards = new Set(
                data.brandCards.map((bc: any) => `${bc.brandName}_${bc.cardName}`),
            );
            const staleBrandCards = Array.from(brandCards.state.keys()).filter(
                (key) => !serverBrandCards.has(key),
            );
            if (staleBrandCards.length > 0)
                await brandCards.delete(staleBrandCards).isPersisted.promise;

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
        if (busy) return;
        busy = true;

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
            if (brandKeys.length > 0) await brands.delete(brandKeys).isPersisted.promise;

            const cardKeys = Array.from(cards.state.keys());
            if (cardKeys.length > 0) await cards.delete(cardKeys).isPersisted.promise;

            const brandCardKeys = Array.from(brandCards.state.keys());
            if (brandCardKeys.length > 0)
                await brandCards.delete(brandCardKeys).isPersisted.promise;

            // Trigger sync
            await runSync();
        } catch (e: any) {
            status = "Error Resetting";
            error = e.message;
            console.error(e);
        } finally {
            busy = false;
        }
    }
</script>

<div class="p-4 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Sync Data</h1>

    <div
        class="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
    >
        <div class="flex items-center justify-between">
            <span class="text-gray-500 dark:text-gray-400 font-medium"
                >Current Status</span
            >
            <span
                class="font-bold text-lg transition-colors duration-300"
                class:text-gray-500={status === "Idle"}
                class:text-blue-600={status.includes("Syncing") ||
                    status.includes("Resetting")}
                class:text-green-600={status === "Sync Complete!"}
                class:text-red-600={status.includes("Error")}
            >
                {status}
            </span>
        </div>
        {#if error}
            <div
                class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm"
            >
                {error}
            </div>
        {/if}
    </div>

    <div class="flex gap-4">
        <button
            onclick={sync}
            class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={busy}
        >
            {status === "Syncing..." ? "Syncing..." : "Sync Now"}
        </button>

        <button
            onclick={resetAndSync}
            class="px-6 py-3 bg-rose-600 text-white font-semibold rounded-xl shadow-md hover:bg-rose-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={busy}
        >
            {status === "Resetting..." ? "Resetting..." : "Reset & Sync"}
        </button>
    </div>
</div>
