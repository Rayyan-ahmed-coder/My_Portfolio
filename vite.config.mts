import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import { ViteMinifyPlugin } from "vite-plugin-minify";
import tsconfigPaths from "vite-tsconfig-paths";
import UnpluginFonts from "unplugin-fonts/vite";
import { compression } from "vite-plugin-compression2";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command }) => {
    const isBuild = command === "build";

    const minifyPlugin = (isBuild ? ViteMinifyPlugin({
        minifyCSS: true,
        collapseWhitespace: true,
        removeComments: true,
    }) : null) as any;

    const brotliPlugin = (isBuild ? compression({ 
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 1024, // Raised to 1KB so tiny structural files aren't double-processed
        ...({
            algorithm: "brotliCompress",
            level: 11
        } as any)
    }) : null) as any;

    const gzipPlugin = (isBuild ? compression({ 
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 1024,
        ...({
            algorithm: "gzip",
            level: 9
        } as any)
    }) : null) as any;

    return {
        base: "./",
        
        css: {
            transformer: "lightningcss",
            lightningcss: {
                targets: { chrome: 111, safari: 16 },
                cssModules: { pattern: "[hash:base64:5]" }
            }
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
                devOptions: {
                    enabled: false, 
                },
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
                        {
                            src: "assets/icons/icon-192.png",
                            sizes: "192x192",
                            type: "image/png",
                            purpose: "any"
                        },
                        {
                            src: "assets/icons/icon-512.png",
                            sizes: "512x512",
                            type: "image/png",
                            purpose: "any"
                        },
                        {
                            src: "assets/icons/maskable-icon-512x512.svg",
                            sizes: "512x512",
                            type: "image/svg+xml",
                            purpose: "maskable"
                        }
                    ]
                },
                injectManifest: {
                    globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,avif,woff2}"],
                    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 
                }
            }),

            minifyPlugin,
            brotliPlugin,
            gzipPlugin,

            UnpluginFonts({
                google: {
                    families: [
                        {
                            name: "Inter",
                            styles: "wght@400;600;700",
                            defer: true,
                        },
                    ],
                },
            })
        ].filter((p): p is PluginOption => p !== null && p !== undefined && p !== false),
        build: {
            target: "esnext",
            minify: "esbuild", 
            assetsInlineLimit: 2048, 
            modulePreload: { polyfill: false },
            reportCompressedSize: false,
            cssCodeSplit: true,
            sourcemap: false,
            
            rollupOptions: {
                input: {
                    main: "index.html"
                },
                output: {
                    entryFileNames: "assets/[name]-[hash].js",
                    chunkFileNames: "assets/[name]-[hash].js",
                    assetFileNames: "assets/[name]-[hash][extname]",
                    manualChunks(id) {
                        if (id.includes("node_modules")) {
                            if (id.includes("react-dom")) return "vendor-react-dom";
                            if (id.includes("react")) return "vendor-react";
                            if (id.includes("framer-motion")) return "vendor-framer-motion";
                            return "vendor-packages"; 
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
                protocol: "ws"
            },
            warmup: {
                clientFiles: ["./index.html", "./src/main.tsx"]
            }
        }
    };
});