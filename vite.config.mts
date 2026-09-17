import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import UnpluginFonts from "unplugin-fonts/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command }) => {
    const isBuild = command === "build";

    return {
        base: "./",
        css: {
            transformer: "lightningcss",
            lightningcss: {
                targets: { chrome: 111, safari: 16 },
                cssModules: { pattern: "[hash:base64:5]" },
            },
        },
        plugins: [
            react(),
            tsconfigPaths(),
            VitePWA({
                strategies: "injectManifest",
                srcDir: ".",
                filename: "sw.mts",
                registerType: "autoUpdate",
                injectRegister: "inline",
                devOptions: { enabled: false },
                manifest: {
                    name: "Rayyan Khan — Frontend Developer",
                    short_name: "Rayyan Khan",
                    description: "Portfolio of Rayyan Khan, a Frontend Developer building fast, modern, and interactive web experiences.",
                    start_url: "./index.html",
                    id: "./index.html",
                    display: "standalone",
                    orientation: "portrait-primary",
                    background_color: "#1d3557",
                    theme_color: "#e63946",
                    categories: ["development", "productivity"],
                    icons: [
                        { src: "assets/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                        { src: "assets/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
                        { src: "assets/icons/maskable-icon-512x512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
                    ],
                },
                injectManifest: {
                    globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,avif,woff2}"],
                    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                },
            }),
            UnpluginFonts({
                google: {
                    families: [{ name: "Inter", styles: "wght@400;600;700", defer: true }],
                },
            }),
        ].filter((plugin): plugin is PluginOption => Boolean(plugin)),
        build: {
            // Let Vite's esbuild and Lightning CSS perform one optimized pass.
            // The previous extra minifier duplicated work and could rewrite output twice.
            target: "es2020",
            minify: "esbuild",
            cssMinify: "lightningcss",
            assetsInlineLimit: 2048,
            modulePreload: { polyfill: false },
            reportCompressedSize: false,
            cssCodeSplit: true,
            sourcemap: false,
            chunkSizeWarningLimit: 700,
            rollupOptions: {
                input: { main: "index.html" },
                output: {
                    entryFileNames: "assets/[name]-[hash].js",
                    chunkFileNames: "assets/[name]-[hash].js",
                    assetFileNames: "assets/[name]-[hash][extname]",
                    // Avoid forcing every dependency into an eagerly downloaded
                    // vendor chunk. Rollup can keep lazy command code lazy.
                    manualChunks: undefined,
                },
            },
        },
        server: {
            port: 5173,
            strictPort: true,
            open: true,
            hmr: { host: "localhost", port: 5173, clientPort: 5173, protocol: "ws" },
            warmup: { clientFiles: ["./index.html", "./src/main.tsx"] },
        },
    };
});
