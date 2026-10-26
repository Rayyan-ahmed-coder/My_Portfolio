// @vitest-environment jsdom
// @vitest-pool threads:false

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import Contact from "./Contact.tsx";

describe("Components — Contact Form", () => {
  afterEach(() => {
    cleanup();
    // 🧹 This resets any fake functions we create so they don't break subsequent tests
    vi.restoreAllMocks();
  });

  it("should display all our form boxes on the screen", () => {
    render(<Contact />);

    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");
    const messageInput = screen.getByLabelText("Message");
    const submitButton = screen.getByRole("button", { name: /Send Message/i });

    expect(nameInput).toBeDefined();
    expect(emailInput).toBeDefined();
    expect(messageInput).toBeDefined();
    expect(submitButton).toBeDefined();
  });

  it("should show warning messages when submitting an empty form", () => {
    render(<Contact />);

    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: /Send Message/i });

    act(() => {
      fireEvent.click(submitButton);
    });

    expect(nameInput.checkValidity()).toBe(false);
    expect(emailInput.checkValidity()).toBe(false);
  });

  it("should process submissions successfully when inputs are valid", () => {
    render(<Contact />);

    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    const messageInput = screen.getByLabelText("Message") as HTMLTextAreaElement;
    const submitButton = screen.getByRole("button", { name: /Send Message/i });

    act(() => {
      fireEvent.change(nameInput, { target: { value: "Rayyan Khan" } });
      fireEvent.change(emailInput, { target: { value: "rayyan@example.com" } });
      fireEvent.change(messageInput, { target: { value: "Let's build an elite high-performance app bro!" } });

      fireEvent.click(submitButton);
    });

    expect(nameInput.checkValidity()).toBe(true);
    expect(emailInput.checkValidity()).toBe(true);
    expect(messageInput.checkValidity()).toBe(true);
  });

  // 👇 TEST 4: Your Custom Clipboard Action Engine!
  it("should copy the email to the clipboard and change button text on click", async () => {
    // 1. Arrange: Mock out the clipboard AND the secure context flag to align with your code guards
    const mockWriteText = vi.fn(() => Promise.resolve());
    vi.useFakeTimers(); // Intercepts setTimeout so we can fast-forward time instantly!

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "isSecureContext", {
      value: true,
      writable: true,
      configurable: true,
    });

    render(<Contact />);

    // 2. Act: Find the copy button by its label and check initial state text
    const copyButton = screen.getByRole("button", { name: /Copy/i });
    expect(copyButton.textContent).toBe("Copy");

    // Click the button!
    await act(async () => {
      fireEvent.click(copyButton);
    });

    // 3. Assert: Verify your clipboard engine was called with your exact code path!
    expect(mockWriteText).toHaveBeenCalled();

    // Check that your text state dynamically changed to your success check mark!
    expect(copyButton.textContent).toBe("Copied! ✓");

    // 4. Act: Fast-forward your 2000ms custom timeout macro task to test the reset loop!
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Check that your button gracefully reset its text back to standard values
    expect(copyButton.textContent).toBe("Copy");

    vi.useRealTimers(); // Restore global clocks back to standard
  });
});
