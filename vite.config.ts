import { constants as zlibConstants } from "node:zlib";
import { defineConfig } from "vitest/config"; // 🟢 Changed from "vite" to automatically handle the test block type!
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { compression, defineAlgorithm } from "vite-plugin-compression2";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    base: "/My_Portfolio/",
    css: {
        transformer: "lightningcss",
        lightningcss: {
            targets: { chrome: 80, safari: 14, edge: 80, firefox: 74 },
            cssModules: { pattern: "[hash:base64:5]" },
        },
    },

    plugins: [
        react(),
        tsconfigPaths(),
        compression({
            include: /\.(?:css|html|js|json|mjs|svg|txt|webmanifest|xml)$/i,
            threshold: 1024,
            skipIfLargerOrEqual: true,
            algorithms: [
                defineAlgorithm("brotliCompress", {
                    params: {
                        [zlibConstants.BROTLI_PARAM_MODE]: zlibConstants.BROTLI_MODE_TEXT,
                        [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
                    },
                }),
                defineAlgorithm("gzip", { level: 9 }),
            ],
        }),
        VitePWA({
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            registerType: "autoUpdate",
            injectRegister: "inline",
            devOptions: { enabled: false },
            manifest: {
                name: "Rayyan Khan — Frontend Developer",
                short_name: "Rayyan Khan",
                description: "Portfolio of Rayyan Khan, a Frontend Developer building fast, modern, and interactive web experiences.",
                start_url: "/My_Portfolio/",
                id: "/My_Portfolio/",
                display: "standalone",
                orientation: "portrait-primary",
                background_color: "#1d3557",
                theme_color: "#e63946",
                categories: ["development", "productivity"],
                icons: [
                    { src: "/My_Portfolio/assets/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                    { src: "/My_Portfolio/assets/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
                    { src: "/My_Portfolio/assets/icons/maskable-icon-512x512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
                ],
            },
            injectManifest: {
                globPatterns: ["**/*.{html,js,css,woff2,webmanifest}"],
                globIgnores: ["**/*.br", "**/*.gz"],
                maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
            },
        }),
    ],

    test: {
      environment: "jsdom",
      globals: true,
      pool: "forks",
      fileParallelism: false, 
      maxWorkers: 1,
      // Extends the timeout barrier so your laptop has plenty of overhead
      testTimeout: 60_000, 
      hookTimeout: 60_000,
      coverage: {
        provider: "v8"
      },
    },

    esbuild: {
        legalComments: "none",
        treeShaking: true,
        drop: ["debugger"],
        pure: ["console.debug", "console.log"],
    },

    build: {
        target: "es2020",
        minify: "esbuild",
        assetsInlineLimit: 4096,
        modulePreload: { polyfill: false },
        reportCompressedSize: false,
        cssCodeSplit: true,
        sourcemap: false,
        rollupOptions: {
            input: { main: "index.html" },
            output: {
                entryFileNames: "assets/[name]-[hash].js",
                chunkFileNames: "assets/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash][extname]",
                manualChunks(id: string) { // 🟢 Fixed: Explicitly typed 'id' as a string
                    const normalizedId = id.replaceAll("\\", "/");
                    if (/\/node_modules\/(react|react-dom|scheduler)\//.test(normalizedId)) {
                        return "vendor-react";
                    }
                },
            },
        },
    },
    
    server: {
        port: 5173,
        strictPort: true,
        open: true,
        hmr: {
            host: "localhost",
            port: 5173,
            clientPort: 5173,
            protocol: "ws",
        },
        warmup: {
            clientFiles: ["./index.html", "./src/main.tsx"],
        },
    },
}); // 🟢 Fixed: Removed the type hack completely!