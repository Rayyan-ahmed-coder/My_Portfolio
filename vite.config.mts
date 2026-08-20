import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { ViteMinifyPlugin } from "vite-plugin-minify";
import tsconfigPaths from "vite-tsconfig-paths";
import UnpluginFonts from "unplugin-fonts/vite";
import { compression } from "vite-plugin-compression2";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
    base: "/My_Portfolio/",
    plugins: [
        react(),
        tsconfigPaths(),
        ViteMinifyPlugin({}),
        compression({ 
            algorithms: ["brotliCompress"], 
            exclude: [/\.(br)$/, /\.(gz)$/]
        }),
        ViteImageOptimizer({
            webp: { quality: 75 },
            avif: { quality: 60 },
        }),
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
    ],
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
        assetsInlineLimit: 10000,
        modulePreload: { polyfill: false },
        reportCompressedSize: true,
        rollupOptions: {
            input: {
                main: "index.html",
                sw: "sw.ts",
            },
            output: {
                entryFileNames: (chunk) =>
                    chunk.name === "sw"? "sw.js" : "assets/[name]-[hash].js",
                chunkFileNames: "assets/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash][extname]",
                
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        if (id.includes("react-dom")) return "react-dom-vendor";
                        if (id.includes("react")) return "react-vendor";
                        return "vendor"; 
                    }
                },
            },
        },
    },
});