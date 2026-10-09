import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

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
        new Portfolio();
    } catch (err) {
        console.error("Enhancement load failure:", err);
    }
};

const defer = (task: () => void): void => {
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(task, { timeout: 350 });
    } else {
        setTimeout(task, 0);
    }
};

defer(initEnhancements);