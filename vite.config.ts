import { defineConfig } from "vite";
import { ViteMinifyPlugin } from "vite-plugin-minify";

export default defineConfig({
    // Ensures assets load correctly under the GitHub Pages sub-folder path.
    base: "/My_Portfolio/",
    // esbuild handles JSX, so Preact components cost no extra build tooling.
    esbuild: {
        jsx: "automatic",
        jsxImportSource: "preact",
    },
    build: {
        target: "es2022",
        minify: "terser",
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                passes: 2,
            },
        },
        // Small assets are inlined to remove render-blocking round-trips.
        assetsInlineLimit: 2048,
        modulePreload: { polyfill: false },
        reportCompressedSize: true,
        rollupOptions: {
            input: {
                main: "index.html",
                // Built alongside the app so the worker ships as compiled, minified JS.
                sw: "sw.ts",
            },
            output: {
                // The worker must keep a stable, un-hashed URL for registration.
                entryFileNames: (chunk) =>
                    chunk.name === "sw" ? "sw.js" : "assets/[name]-[hash].js",
                chunkFileNames: "assets/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash][extname]",
            },
        },
    },
    plugins: [ViteMinifyPlugin({})],
});
