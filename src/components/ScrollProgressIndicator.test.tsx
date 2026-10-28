import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
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

  it("should check the width to be 0 at the top of the website", () => {
    render(<ScrollProgressIndicator />);

    mockScrollPercentage(0);

    const indicator = screen.getByLabelText("Scrolled percentage indicator");
    expect(indicator.style.width).toBe("0%");
  });

  it("should calculate exact width constraints when scrolled to 50% depth", () => {
    render(<ScrollProgressIndicator />);

    mockScrollPercentage(50);

    const indicator = screen.getByLabelText("Scrolled percentage indicator");
    expect(indicator.style.width).toBe("50%");
  });

  it("should stretch to full workspace bounds matching 100% completion layout lines", () => {
    render(<ScrollProgressIndicator />);

    mockScrollPercentage(100);

    const indicator = screen.getByLabelText("Scrolled percentage indicator");
    expect(indicator.style.width).toBe("100%");
  });
});
