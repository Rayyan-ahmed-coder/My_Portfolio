import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AnalyticsSection from "./Analytics";

describe("AnalyticsSection", () => {
  it("reports metrics derived from the project data", () => {
    render(<AnalyticsSection />);

    expect(screen.getByRole("heading", { name: "A snapshot of what I build." })).toBeTruthy();
    expect(screen.getByText("STACK MENTIONS").nextElementSibling?.textContent).toBe("08");
    expect(screen.getByText("UNIQUE TOOLS").nextElementSibling?.textContent).toBe("06");
  });

  it("shows project-category and technology breakdowns", () => {
    render(<AnalyticsSection />);

    const categories = within(screen.getByRole("region", { name: "What I make" }));
    expect(categories.getByRole("img", { name: "Web experiences: 2 of 3 projects" })).toBeTruthy();
    expect(categories.getByRole("img", { name: "Games: 1 of 3 projects" })).toBeTruthy();

    const stack = within(screen.getByRole("region", { name: "What\u2019s in the stack" }));
    expect(stack.getByText("CSS")).toBeTruthy();
    expect(stack.getByText("TypeScript")).toBeTruthy();
  });
});
