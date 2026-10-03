import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App.tsx";
import Portfolio from "./app.mts";
import { getSectionScrollTop } from "./modules/scroll.js";

describe("App Architecture & Layout", () => {
    
    it("renders the work section and project grid so project content can load", () => {
        const html = renderToStaticMarkup(<App />);

        expect(html).toContain('id="work"');
        expect(html).toContain('id="projects-grid"');
        expect((html.match(/id="availability-card"/g) ?? []).length).toBe(1);
    });

    it("keeps initialization idempotent so modules are not recreated on a second boot", () => {
        const portfolio = new Portfolio();
        const theme = portfolio.modules.theme;
        const nav = portfolio.modules.navigation;

        portfolio.initialize();

        expect(portfolio.modules.theme).toBe(theme);
        expect(portfolio.modules.navigation).toBe(nav);
    });

    it("keeps section anchors clear of the fixed header when scrolling", () => {
        vi.stubGlobal("window", {
            scrollY: 180,
            innerHeight: 900,
        });
        vi.stubGlobal("document", {
            documentElement: {
                scrollHeight: 2000,
                style: { setProperty: vi.fn() },
            },
        });

        const mockHeaderHeight = 80;
        const mockSection = {
            getBoundingClientRect: () => ({ top: 640 }),
        } as HTMLElement;

        expect(getSectionScrollTop(mockSection, mockHeaderHeight)).toBe(740);
        
        vi.unstubAllGlobals();
    });
});