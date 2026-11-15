import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import ScrollProgressIndicator from "./ScrollProgressIndicator";

describe("ScrollProgressIndicator Core Calculation Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockScrollPercentage = (percentage: number) => {
    const mockViewportHeight = 1000;
    const mockMaxScrollRange = 1000;
    const mockDocumentHeight = mockViewportHeight + mockMaxScrollRange;

    Object.defineProperty(window, "innerHeight", { value: mockViewportHeight, configurable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", { value: mockDocumentHeight, configurable: true });

    const mockScrollTop = percentage * 0.01 * mockMaxScrollRange;
    Object.defineProperty(window, "scrollY", { value: mockScrollTop, configurable: true });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
  };

  it("keeps the progress at zero at the top of the website", () => {
    const { container } = render(<ScrollProgressIndicator />);

    mockScrollPercentage(0);

    const indicator = container.querySelector(".scroll-progress-indicator");
    expect(indicator?.getAttribute("aria-hidden")).toBe("true");
    expect(indicator?.getAttribute("style")).toContain("--scroll-progress: 0");
  });

  it("updates the composited progress scale at 50% depth", () => {
    const { container } = render(<ScrollProgressIndicator />);

    mockScrollPercentage(50);

    const indicator = container.querySelector(".scroll-progress-indicator");
    expect(indicator?.getAttribute("style")).toContain("--scroll-progress: 0.5");
  });

  it("caps progress at the end of the document", () => {
    const { container } = render(<ScrollProgressIndicator />);

    mockScrollPercentage(100);

    const indicator = container.querySelector(".scroll-progress-indicator");
    expect(indicator?.getAttribute("style")).toContain("--scroll-progress: 1");
  });
});
