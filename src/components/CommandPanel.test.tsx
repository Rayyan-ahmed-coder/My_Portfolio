// @vitest-environment jsdom

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { CommandPanel } from "./CommandPanel";

describe("📡 DECOUPLED DATA-DRIVEN COMMAND CENTER INTERACTION MATRIX", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Add this helper snippet to completely silence unmapped layout warning strings in low-RAM test pipelines
    window.HTMLElement.prototype.scrollIntoView = vi.fn((options) => {
      return { context: "mocked-viewport-coordinates", options };
    });
    document.documentElement.className = "";
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("should mount database layout parameters cleanly when custom window events fire", async () => {
    render(<CommandPanel />);

    act(() => {
      window.dispatchEvent(new CustomEvent("core-engine:toggle-palette"));
    });

    expect(screen.getByText("Command Center Core")).toBeDefined();
    expect(screen.getByPlaceholderText(/Search commands, tools, structural variables.../i)).toBeDefined();
    expect(screen.getByText("Go to Home")).toBeDefined();
  });

  it("should filter the search outputs perfectly against JSON array string components", () => {
    render(<CommandPanel />);

    act(() => {
      window.dispatchEvent(new CustomEvent("core-engine:toggle-palette"));
    });

    const input = screen.getByPlaceholderText(/Search commands, tools, structural variables.../i) as HTMLInputElement;
    act(() => {
      fireEvent.change(input, { target: { value: "source code" } });
    });

    expect(screen.getByText("View source code")).toBeDefined();
    expect(screen.queryByText("Go to Skills")).toBeNull();
  });

  it("should display empty state message when search query finds no results", () => {
    render(<CommandPanel />);

    act(() => {
      window.dispatchEvent(new CustomEvent("core-engine:toggle-palette"));
    });

    const searchInput = screen.getByPlaceholderText(/Search commands, tools, structural variables.../i);
    act(() => {
      fireEvent.change(searchInput, { target: { value: "xyzqwerty123" } });
    });

    expect(screen.getByText("No matching system routes.")).toBeDefined();
  });

  it("should execute system actions and close the panel smoothly upon option click", async () => {
    render(<CommandPanel />);

    act(() => {
      window.dispatchEvent(new CustomEvent("core-engine:toggle-palette"));
    });

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);

    // Click the first option row directly to fire the action sequence
    act(() => {
      fireEvent.click(options[0]);
    });

    // The panel automatically dispatches closing sequences upon running commands
    expect(screen.queryByText("Command Center Core")).toBeNull();
  });

  it("should capture the escape keystroke event actions to launch closing sequences", () => {
    render(<CommandPanel />);
    act(() => {
      window.dispatchEvent(new CustomEvent("core-engine:toggle-palette"));
    });

    expect(screen.queryByText("Command Center Core")).not.toBeNull();

    act(() => {
      fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
    });

    expect(screen.queryByText("Command Center Core")).toBeNull();
  });
});
