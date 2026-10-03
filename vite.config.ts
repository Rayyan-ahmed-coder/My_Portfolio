import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { compression, defineAlgorithm } from "vite-plugin-compression2";
import { VitePWA } from "vite-plugin-pwa";
import { ViteMinifyPlugin } from "vite-plugin-minify"; 

export default defineConfig(({ command }) => {
    const isBuild = command === "build";

    return {
        base: '/My_Portfolio_2v/',
        css: {
            transformer: "lightningcss",
            lightningcss: {
                targets: { chrome: 115, safari: 16, edge: 115, firefox: 115 },
                cssModules: { pattern: "[hash:base64:5]" }
            }
        },

        plugins: [
            react(),
            tsconfigPaths(),
            
            ViteMinifyPlugin({
                collapseWhitespace: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                removeAttributeQuotes: true
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
                    start_url: "/My_Portfolio_2v/",
                    id: "/My_Portfolio_2v/",
                    display: "standalone",
                    orientation: "portrait-primary",
                    background_color: "#1d3557",
                    theme_color: "#e63946",
                    categories: ["development", "productivity"],
                    icons: [
                        { src: "/My_Portfolio_2v/assets/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                        { src: "/My_Portfolio_2v/assets/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
                        { src: "/My_Portfolio_2v/assets/icons/maskable-icon-512x512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" }
                    ]
                },
                injectManifest: {
                    globPatterns: ["assets/*.{js,css,woff2}", "index.html", "*.webmanifest"],
                    globIgnores: ["**/*.gz", "**/*.br"],
                    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024 
                }
            }),

            ...(isBuild ? [
                compression({
                    exclude: [/\.(br)$/, /\.(gz)$/, /\.(woff2)$/],
                    threshold: 0,
                    algorithms: [
                        defineAlgorithm("brotliCompress", { level: 11 }),
                        defineAlgorithm("gzip", { level: 9 })
                    ]
                })
            ] : []),
        ],

        build: {
            target: "esnext", 
            minify: "esbuild", 
            assetsInlineLimit: 4096,
            modulePreload: { polyfill: false },
            reportCompressedSize: false,
            cssCodeSplit: true,
            sourcemap: false,
            
            esbuild: {
                legalComments: "none",
                treeShaking: true,
                drop: ["console", "debugger"]
            },
            
            rollupOptions: {
                input: { main: "index.html" },
                output: {
                    entryFileNames: "assets/[name]-[hash].js",
                    chunkFileNames: "assets/[name]-[hash].js",
                    assetFileNames: "assets/[name]-[hash][extname]",
                    experimentalMinChunkSize: 12288,
                    manualChunks(id) {
                        if (id.includes("node_modules")) {
                            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
                                return "vendor-core";
                            }
                            if (id.includes("framer-motion")) {
                                return "vendor-motion";
                            }
                            return "vendor-utils"; 
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