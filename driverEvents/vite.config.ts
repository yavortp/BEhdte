import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
    define: {
        global: {},
    },
    resolve: {
        alias: {
            'buffer': 'buffer'
        }
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',    //BE server
                changeOrigin: true,
                secure: false,
            },
        },
    },
});