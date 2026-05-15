import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    base: '/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
        target: 'es2015',
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'chart-vendor': ['chart.js', 'react-chartjs-2'],
                    'map-vendor': ['leaflet', 'react-leaflet'],
                },
            },
        },
    },
});
