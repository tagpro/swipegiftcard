<script lang="ts">
    import { onMount } from "svelte";

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
</script>

<div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Settings</h1>

    <div class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Appearance</h2>
        <button
            onclick={toggleTheme}
            class="px-4 py-2 border rounded shadow hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
            Switch to {isDark ? "Light" : "Dark"} Mode
        </button>
    </div>

    <div class="mb-4">
        <h2 class="text-xl font-semibold mb-2">Data</h2>
        <a
            href="/sync"
            class="block p-4 border rounded shadow hover:bg-gray-50 text-center dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
            Go to Sync Page
        </a>
    </div>
</div>
