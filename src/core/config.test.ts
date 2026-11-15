import { afterEach, describe, expect, it } from "vitest";
import { cleanup } from "@testing-library/react";
import { CONFIG } from "./config";

describe("Checking config file's configuration to be similar", () => {
  afterEach(() => {
    cleanup();
  });

  it("should check if public email is correct", () => {
    const publicEmail = CONFIG.PUBLIC_EMAIL;

    expect(publicEmail).toBe("rayyan.workhost@gmail.com");
  });

  it("should check the portfolio theme key", () => {
    const portfolioThemeKey = CONFIG.STORAGE_THEME_KEY;

    expect(portfolioThemeKey).toBe("__portfolio_theme__");
  });

  it("should check the observer threshold", () => {
    const observerThreshold = CONFIG.OBSERVER_THRESHOLD;

    expect(observerThreshold).not.toBeNaN();
    expect(observerThreshold).toBeGreaterThanOrEqual(0);
    expect(observerThreshold).toBeLessThanOrEqual(1);
    expect(observerThreshold).toBe(0.15);
  });
});
