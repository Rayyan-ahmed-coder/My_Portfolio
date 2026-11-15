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
  </StrictMode>,
);

const initEnhancements = async (): Promise<void> => {
  try {
    const { default: Portfolio } = await import("./app.js");
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
// console.log((() => {
//   const d = new Date();
//   const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, '0');
//   const off = -d.getTimezoneOffset();
//   const sign = off >= 0 ? '+' : '-';
//   const local = new Date(d.getTime() + off * 60000);
//   const iso = `${local.toISOString().slice(0, 19)}${sign}${pad(off / 60)}:${pad(off % 60)}`;
//   return iso;
// })());
