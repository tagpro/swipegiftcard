<script lang="ts">
    import { onMount } from "svelte";

    interface Props {
        items: any[];
        onSwipeLeft?: (item: any) => void;
        onSwipeRight?: (item: any) => void;
    }

    let { items = [], onSwipeLeft, onSwipeRight }: Props = $props();

    let currentIndex = $state(0);
    let startX = $state(0);
    let currentX = $state(0);
    let isDragging = $state(false);
    let cardElement: HTMLElement | null = $state(null);

    function handleStart(x: number) {
        startX = x;
        isDragging = true;
    }

    function handleMove(x: number) {
        if (!isDragging) return;
        currentX = x - startX;
    }

    function handleEnd() {
        if (!isDragging) return;
        isDragging = false;

        const threshold = 100;
        if (currentX > threshold) {
            // Swipe Right
            if (onSwipeRight) onSwipeRight(items[currentIndex]);
            currentIndex++;
        } else if (currentX < -threshold) {
            // Swipe Left
            if (onSwipeLeft) onSwipeLeft(items[currentIndex]);
            currentIndex++;
        }
        currentX = 0;
    }

    function onTouchStart(e: TouchEvent) {
        handleStart(e.touches[0].clientX);
    }

    function onTouchMove(e: TouchEvent) {
        handleMove(e.touches[0].clientX);
    }

    function onMouseDown(e: MouseEvent) {
        handleStart(e.clientX);
    }

    function onMouseMove(e: MouseEvent) {
        handleMove(e.clientX);
    }
</script>

<div
    class="relative w-full h-96 flex justify-center items-center overflow-hidden"
>
    {#if currentIndex < items.length}
        <div
            bind:this={cardElement}
            class="absolute w-64 h-80 bg-white rounded-xl shadow-xl flex flex-col justify-center items-center p-6 border border-gray-200 select-none cursor-grab active:cursor-grabbing"
            style="transform: translateX({currentX}px) rotate({currentX *
                0.05}deg); transition: {isDragging
                ? 'none'
                : 'transform 0.3s ease'};"
            ontouchstart={onTouchStart}
            ontouchmove={onTouchMove}
            ontouchend={handleEnd}
            onmousedown={onMouseDown}
            onmousemove={onMouseMove}
            onmouseup={handleEnd}
            onmouseleave={handleEnd}
            role="button"
            tabindex="0"
        >
            <h2 class="text-2xl font-bold mb-2 text-center">
                {items[currentIndex].name}
            </h2>
            {#if items[currentIndex].source}
                <p class="text-gray-500">{items[currentIndex].source}</p>
            {/if}
            <div class="mt-8 text-sm text-gray-400">Swipe left or right</div>
        </div>
    {:else}
        <div class="text-center">
            <h2 class="text-xl font-semibold">No more cards!</h2>
            <button
                class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onclick={() => (currentIndex = 0)}
            >
                Start Over
            </button>
        </div>
    {/if}
</div>
