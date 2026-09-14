import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "../css/style.css";
import "../css/responsive.css";

const container = document.getElementById("root");
if (!container) {
    throw new Error("Critical Boot Failure: Target element '#root' was not found in the DOM.");
}

createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>
);

const startEnhancements = (): void => {
    void import("./app.mts").then(({ default: Portfolio }) => new Portfolio());
};

if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(startEnhancements, { timeout: 1500 });
} else {
    setTimeout(startEnhancements, 200);
}