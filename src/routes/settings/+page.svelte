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
</div>
