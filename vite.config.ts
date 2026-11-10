import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
// Pixel-by-pixel art audits compete for CPU; bound concurrency instead of
// weakening their assertions or extending their existing five-second timeout.
export default defineConfig({ plugins: [vue()], test: { include: ['tests/unit/**/*.test.ts'], maxWorkers: 2 }, build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } } });
