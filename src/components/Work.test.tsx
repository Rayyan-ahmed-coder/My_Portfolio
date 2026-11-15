import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WorkSection from "./Work";

describe("WorkSection project filters", () => {
  it("renders all projects by default", () => {
    render(<WorkSection />);

    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("status").textContent).toBe("Showing 3 projects");
  });

  it("renders only matching projects after a filter is selected", () => {
    render(<WorkSection />);

    fireEvent.click(screen.getByRole("button", { name: "Games" }));

    const projects = screen.getAllByRole("article");
    expect(projects).toHaveLength(1);
    expect(within(projects[0]).getByRole("heading", { name: "Air Jumper" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Calculator" })).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Showing 1 project");
  });
});
