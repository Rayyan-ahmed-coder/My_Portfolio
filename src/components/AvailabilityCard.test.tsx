// @vitest-environment jsdom
// @vitest-pool threads:false

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import AvailabilityCard from "./AvailabilityCard";
import { CONFIG } from "../core/config";

afterEach(() => {
  cleanup(); // Cleanly wipes your virtual browser document canvas completely clear
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("⚡ AVAILABILITY CARD COMPONENT TEST MATRIX", () => {
  it("renders baseline layout attributes and structural text cleanly", () => {
    render(<AvailabilityCard />);

    expect(screen.getByText(/Available for select projects/i)).toBeDefined();
    expect(screen.getByText(/Have a thoughtful idea\?/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Copy my email/i })).toBeDefined();
  });

  it("updates localized clock interval text when time passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T16:00:00.000Z"));

    render(<AvailabilityCard />);
    const clockLabel = screen.getByText(/Local time/i);
    const initialTime = clockLabel.textContent;

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 60 * 1000);
    });

    const updatedTime = screen.getByText(/Local time/i).textContent;

    expect(updatedTime).toBeDefined();
    expect(updatedTime).not.toBe(initialTime);
  });

  it("triggers clipboard transmission pipeline smoothly when copy button is activated", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    // 🛡️ Hardened environment configuration maps:
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "isSecureContext", {
      value: true,
      writable: true,
      configurable: true,
    });

    render(<AvailabilityCard />);
    const copyBtn = screen.getByRole("button", { name: /Copy my email/i });

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    // Check that the clipboard received the exact email configuration variable
    expect(writeTextMock).toHaveBeenCalledWith(CONFIG.EMAIL);

    // Verify the visual state flips to give real-time confirmation back to the user
    expect(screen.getByText(/Email copied/i)).toBeDefined();
  });
});
