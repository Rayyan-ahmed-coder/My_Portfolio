import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App.tsx";

describe("App", () => {
    it("renders the work section and project grid so project content can load", () => {
        const html = renderToStaticMarkup(<App />);

        expect(html).toContain('id="work"');
        expect(html).toContain('id="projects-grid"');
        expect((html.match(/id="availability-card"/g) ?? []).length).toBe(1);
    });
});
