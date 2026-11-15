import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TechnologiesSection from "./Technologies";

describe("TechnologiesSection", () => {
  it("renders each tool as a properly structured skill heading", () => {
    render(<TechnologiesSection />);

    expect(screen.getByRole("heading", { name: "A toolkit for making things." })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(9);
    expect(screen.getByRole("heading", { name: "TypeScript", level: 3 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "VS Code", level: 3 })).toBeTruthy();
  });

  it("labels frontend and workflow tools without implying proficiency scores", () => {
    render(<TechnologiesSection />);

    expect(screen.getAllByText("Frontend")).toHaveLength(5);
    expect(screen.getAllByText("Workflow")).toHaveLength(4);
    expect(screen.getByText("9").closest(".skills-overview")).toBeTruthy();
  });
});
