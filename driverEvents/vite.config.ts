import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],

    envDir: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebaseui'],
                    'map-vendor': ['leaflet', 'react-leaflet'],
                }
            }
        }
    },

    optimizeDeps: {
        include: ['firebase/app', 'firebase/auth'],
        exclude: ['lucide-react'],
    },
    define: {
        global: 'globalThis',
    },
    resolve: {
        alias: {
            'buffer': 'buffer'
        }
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',    //BE server
                changeOrigin: true,
                secure: false,
            },
            '/ws': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
                ws: true,
            }
        },
    },
});