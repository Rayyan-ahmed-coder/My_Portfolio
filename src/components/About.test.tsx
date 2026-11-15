import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutSection from "./About";

describe("AboutSection", () => {
  it("introduces Rayyan and the principles behind his work", () => {
    render(<AboutSection />);

    expect(screen.getByRole("heading", { name: /Curious by nature.*Thoughtful by design/i })).toBeTruthy();
    expect(screen.getByText(/something you can click, explore and make your own/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Start with purpose" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Make it feel effortless" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Care about the details" })).toBeTruthy();
    const contactLink = screen.getByRole("link", { name: /Have something in mind\? Let\u2019s make it real/i });
    expect(contactLink.getAttribute("href")).toBe("#contact");
  });
});
