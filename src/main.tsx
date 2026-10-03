import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// import "./css/style.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Critical Boot Failure: Target element '#root' was not found in the DOM.");
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);

const initEnhancements = async (): Promise<void> => {
    try {
        const { default: Portfolio } = await import("./app.mjs");
        if (typeof Portfolio === "function") {
            new Portfolio();
            console.log(
                "%cPortfolio %cinitialized %csuccessfully!",
                "color: #00f7ff; font-weight: 500;",
                "",
                "color: #00ff37; font-weight: 500;"
            );
        }
    } catch (err) {
        console.error("Enhancement load failure:", err);
    }
};

// Highest performance non-blocking defer:
// Uses native requestIdleCallback if present, falls back to a 0ms macrotask deferral
const defer = (task: () => void): void => {
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(task, { timeout: 350 });
    } else {
        setTimeout(task, 0);
    }
};

// ES modules load deferred by default, meaning DOM is guaranteed ready or parsing.
// Listening to 'load' ensures initial rendering and critical assets finish first.
if (document.readyState === "complete") {
    defer(initEnhancements);
} else {
    window.addEventListener("load", () => defer(initEnhancements), { once: true });
}