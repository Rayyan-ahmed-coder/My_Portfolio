import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "../css/style.css";
import "../css/responsive.css";
import "../css/performance.css";

const container = document.getElementById("root");
if (!container) {
    throw new Error("Critical Boot Failure: Target element '#root' was not found in the DOM.");
}

createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>,
);

const startEnhancements = (): void => {
    void import("./app.mts").then(({ default: Portfolio }) => new Portfolio());
};

// Keep the critical React render path free of enhancement-module work. The
// fallback also yields once on browsers without requestIdleCallback.
if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(startEnhancements, { timeout: 1200 });
} else {
    window.setTimeout(startEnhancements, 100);
}
