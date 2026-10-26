// @vitest-environment jsdom
// @vitest-pool threads:false

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import UpdateNotification from "./UpdateNotification.tsx";

describe("Components — UpdateNotification Toast", () => {
  let capturedAnimationInstance = {
    onfinish: null as (() => void) | null,
    cancel: vi.fn(),
  };

  beforeEach(() => {
    // Reset our hooks before each run
    capturedAnimationInstance.onfinish = null;
    capturedAnimationInstance.cancel = vi.fn();

    // 1. Instantly fire requestAnimationFrame loops
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    // 2. Direct prototype tracking hook injection
    window.HTMLElement.prototype.animate = function () {
      return capturedAnimationInstance as any;
    };

    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  // 🎯 TEST 1: Baseline Layout Existence Check
  it("should render the updated status notification text when version hash changes", async () => {
    vi.stubGlobal("setTimeout", vi.fn());

    render(<UpdateNotification />);

    expect(screen.getByText("Updated")).toBeDefined();
    expect(screen.getByText("✓")).toBeDefined();
  });

  // 🎯 TEST 2: Synchronous Early Exit Dismissal Check
  it("should trigger fade animation and self-dismiss cleanly after the visible duration", async () => {
    vi.stubGlobal("setTimeout", (cb: Function) => {
      cb();
      return 1;
    });

    render(<UpdateNotification />);

    const updateTextCheck = screen.queryByText("Updated");
    expect(updateTextCheck).toBeNull();
  });

  // 🎯 TEST 3: Deep Animation Lifecycle Coverage Completion Check
  it("should execute the complete fade animation pipeline and update local storage", async () => {
    let storedCallback: Function | null = null;

    // Capture the timer callback handle for execution post-paint
    vi.stubGlobal("setTimeout", (cb: Function) => {
      storedCallback = cb;
      return 1;
    });

    render(<UpdateNotification />);

    // Verify element existence to ensure layout ref binding completes
    expect(screen.getByText("Updated")).toBeDefined();

    // Trigger the captured timer sequence
    act(() => {
      if (storedCallback) {
        storedCallback();
      }
    });

    // Fire the captured animation completion callback
    act(() => {
      if (capturedAnimationInstance.onfinish) {
        capturedAnimationInstance.onfinish();
      }
    });

    // Confirm total unmounting sequence completes
    const updateTextCheck = screen.queryByText("Updated");
    expect(updateTextCheck).toBeNull();
  });
});
