// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Features from "./Features.tsx";

describe("Features section", () => {
  it("shows all four portfolio principles and their supporting points", () => {
    render(<Features />);

    expect(screen.getByRole("heading", { name: /Good work is more than good looks/i })).toBeDefined();

    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(4);
    expect(within(cards[0]).getByRole("heading", { name: "Performance" })).toBeDefined();
    expect(within(cards[0]).getByText("Minimal dependencies")).toBeDefined();
    expect(within(cards[3]).getByRole("heading", { name: "Modern" })).toBeDefined();
  });
});
