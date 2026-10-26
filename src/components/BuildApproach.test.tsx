// @vitest-environment jsdom
// @vitest-pool threads:false

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import BuildApproach from "./BuildApproach";

afterEach(() => {
  cleanup(); // Safely wipes our virtual layout engine canvas clean between checks
  document.body.innerHTML = "";
});

describe("🏗️ BUILD APPROACH COMPONENT UNIT TESTING MATRIX", () => {
  it("mounts the component and displays initial phase info successfully", () => {
    render(<BuildApproach />);

    // Check if the title text metrics mount cleanly
    expect(screen.getByRole("heading", { name: /From first thought to real thing/i })).toBeDefined();
    // Phase 1 should be the default active layout panel frame
    expect(screen.getByRole("tab", { name: /01 Discover/i })).toBeDefined();
    expect(screen.getByText("Start with the right questions.")).toBeDefined();
  });

  it("swaps active panels fluidly when clicking on another tab element button", async () => {
    render(<BuildApproach />);

    const secondTab = screen.getByRole("tab", { name: /02 Build/i });

    // Simulate user clicking on the second tab entry point
    act(() => {
      fireEvent.click(secondTab);
    });

    // The visual title string parameter must dynamically update on screen
    expect(screen.getByText("Make the experience feel inevitable.")).toBeDefined();
    expect(secondTab.getAttribute("aria-selected")).toBe("true");
  });

  it("handles complex accessible keyboard keyboard arrow traversals correctly", () => {
    render(<BuildApproach />);

    const firstTab = screen.getByRole("tab", { name: /01 Discover/i });

    // Pressing ArrowRight must shift focus down to Phase 02 automatically
    act(() => {
      fireEvent.keyDown(firstTab, { key: "ArrowRight" });
    });
    const secondTab = screen.getByRole("tab", { name: /02 Build/i });
    expect(secondTab.getAttribute("aria-selected")).toBe("true");

    // Pressing End must skip straight to the last active index lane
    act(() => {
      fireEvent.keyDown(secondTab, { key: "End" });
    });
    const thirdTab = screen.getByRole("tab", { name: /03 Launch/i });
    expect(thirdTab.getAttribute("aria-selected")).toBe("true");
  });
});
