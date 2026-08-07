import { defineConfig } from 'vite';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import { imagemin } from 'vite-plugin-imagemin';

export default defineConfig({
    // Ensures assets load correctly under your GitHub Pages sub-folder path
    base: '/My_Portfolio/', 
    build: {
        minify: 'terser', // High-efficiency script compression
        terserOptions: {
            compress: {
                drop_console: true, // Automatically strips console.logs to save file space
                drop_debugger: true,
            },
        },
        rollupOptions: {
        output: {
            // Code Splitting: Splits large dependencies into smaller, separate chunks for parallel loading
            manualChunks(id) {
                if (id.includes('node_modules')) {
                    return 'vendor';
                }
            },
        },
        },
    },
    plugins: [
        ViteMinifyPlugin({}), // Minifies the output HTML markup completely
        imagemin({
            gifsicle: { optimizationLevel: 7 },
            mozjpeg: { quality: 75 },
            pngquant: { quality: [0.6, 0.8], speed: 4 },
            webp: { quality: 75 } // Compresses images into lightweight WebP format
        }),
    ],
});