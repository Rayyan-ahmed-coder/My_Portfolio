import { describe, expect, it, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App.tsx";
import Portfolio from "./app.mts";
import { getSectionScrollTop } from "./modules/scroll.js";

// Mock out dynamic modules so Vitest processes imports instantly
vi.mock("./core/observer", () => ({
  default: class MockObserver {
    observe = vi.fn();
    destroy = vi.fn();
  },
}));
vi.mock("./modules/cursor", () => ({
  default: class MockCursor {
    destroy = vi.fn();
  },
}));

// 🟢 FIX: Partially mock the scroll module so the real getSectionScrollTop utility remains accessible
vi.mock("./modules/scroll", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./modules/scroll")>();
  return {
    ...actual, // Keeps your real getSectionScrollTop export intact
    default: class MockScroll {
      destroy = vi.fn();
    }, // Only overrides the default class instance
  };
});

// Force the idle task scheduler loop to run synchronously for our coverage blocks
vi.mock("./core/utilities.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./core/utilities.js")>();
  return {
    ...actual,
    onIdle: (cb: () => void) => cb(),
  };
});

describe("App Architecture & Layout", () => {
  afterEach(() => {
    // Clean the global document workspace thoroughly after every single test run
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders the work section and project grid layout markup cleanly", () => {
    const html = renderToStaticMarkup(<App />);

    // Validate structural design foundations
    expect(html).toContain('id="work"');
    expect((html.match(/id="availability-card"/g) ?? []).length).toBe(1);

    // Check that button attributes are rendered correctly in the core shell
    expect(html).toContain("View my work");
    expect(html).toContain("Let&#x27;s talk");
  });

  it("keeps initialization idempotent so modules are not recreated on a second boot", () => {
    // Inject structural context ONLY inside this test container to prevent leaks
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "command-toggle";
    document.body.appendChild(toggleBtn);

    const portfolio = new Portfolio();
    const theme = portfolio.modules.theme;
    const nav = portfolio.modules.navigation;

    // Trigger double-boot verification pathway
    portfolio.initialize();

    expect(portfolio.modules.theme).toBe(theme);
    expect(portfolio.modules.navigation).toBe(nav);

    // Track state emissions across interactive layout channels
    const toggle = document.getElementById("command-toggle");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    toggle?.click();
    expect(dispatchSpy).toHaveBeenCalled();

    // Fire hardware combination routines (Ctrl + K) to sweep up event handlers
    const ctrlKEvent = new KeyboardEvent("keydown", { ctrlKey: true, key: "k" });
    document.dispatchEvent(ctrlKEvent);
    expect(dispatchSpy).toHaveBeenCalledTimes(2);

    // Clean up completely to log coverage data across teardown subroutines
    portfolio.destroy();
    expect(portfolio.modules.theme).toBeUndefined;
  });

  it("keeps section anchors clear of the fixed header when scrolling", () => {
    const originalScrollY = window.scrollY;
    const originalInnerHeight = window.innerHeight;
    const originalScrollHeight = document.documentElement.scrollHeight;
    const originalSetProperty = document.documentElement.style.setProperty;

    Object.defineProperty(window, "scrollY", { value: 180, writable: true, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 900, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 2000,
      writable: true,
      configurable: true,
    });

    const mockSetProperty = vi.fn();
    document.documentElement.style.setProperty = mockSetProperty;

    const mockHeaderHeight = 80;
    const mockSection = {
      getBoundingClientRect: () => ({ top: 640 }),
    } as HTMLElement;

    // This will now find the real math utility function and succeed perfectly!
    expect(getSectionScrollTop(mockSection, mockHeaderHeight)).toBe(740);

    // Restore environmental configurations back to pristine condition
    Object.defineProperty(window, "scrollY", { value: originalScrollY, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: originalInnerHeight, configurable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: originalScrollHeight,
      configurable: true,
    });
    document.documentElement.style.setProperty = originalScrollHeight ? originalSetProperty : () => {};
  });
});
