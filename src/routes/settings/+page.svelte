<script lang="ts">
    import { onMount } from "svelte";

    import { deferredPrompt } from "$lib/stores/pwa";

    let isDark = $state(false);

    onMount(() => {
        isDark = document.documentElement.classList.contains("dark");
    });

    function toggleTheme() {
        isDark = !isDark;
        if (isDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }

    function install() {
        const promptEvent = $deferredPrompt;
        if (!promptEvent) return;
        promptEvent.prompt();
        promptEvent.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === "accepted") {
                deferredPrompt.set(null);
            }
        });
    }
</script>

<div class="p-4 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Settings</h1>

    <div class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Appearance</h2>
        <button
            onclick={toggleTheme}
            class="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl shadow-md hover:bg-gray-800 hover:shadow-lg active:scale-95 transition-all dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
            Switch to {isDark ? "Light" : "Dark"} Mode
        </button>
    </div>

    <div class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Install as an App</h2>
        <button
            onclick={install}
            disabled={!$deferredPrompt}
            class="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
        >
            Install
        </button>
        {#if !$deferredPrompt}
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Install button is disabled because the app is already installed
                or the browser doesn't support installation.
            </p>
        {/if}
    </div>
</div>
