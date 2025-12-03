import { writable } from 'svelte/store';

export const deferredPrompt = writable<any>(null);
