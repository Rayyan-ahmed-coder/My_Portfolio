import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./css/style.css";

const container = document.getElementById("root");
if (!container) {
    throw new Error("Critical Boot Failure: Target element '#root' was not found in the DOM.");
}

createRoot(container).render(
    <StrictMode>
        <App/>
    </StrictMode>
);

const startEnhancements = async (): Promise<void> => {
    const module = await import("./app.mjs");
    const Portfolio = module.default;

    if (typeof Portfolio === "function") {
        new Portfolio();
        console.log("Portfolio enhancements initialized successfully!");
    } else {
        console.warn("Expected a default class export from app.mjs, but received:", typeof Portfolio);
    }
};

const scheduleEnhancements = (): void => {
    const run = (): void => {
        void startEnhancements();
    };

    if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(run, { timeout: 350 });
        return;
    }

    window.setTimeout(run, 150);
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleEnhancements, { once: true });
} else {
    window.requestAnimationFrame(scheduleEnhancements);
}