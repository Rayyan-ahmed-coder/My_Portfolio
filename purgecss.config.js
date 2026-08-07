/** @type {import('tailwindcss').Config} */
module.exports = {
    // Scans all your files to find exactly what styles you actually use
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx,html}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
    // Forces strict optimization builds
    future: {
        hoverOnlyWhenSupported: true, // Speeds up touch interactions on mobile devices
    },
}