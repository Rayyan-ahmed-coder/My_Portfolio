import { useEffect, useState } from "preact/hooks";
import { $, $$, listen } from "../../core/utilities.js";
import { warn } from "../../core/logger.js";

const SCOPE = "projects";

export const DEFAULT_FILTER = "all";

const readFilter = (button: HTMLElement | null): string =>
    (button?.dataset.filter ?? DEFAULT_FILTER).trim().toLowerCase();

/**
 * The filter buttons are static markup outside the island, so one delegated
 * listener on their container feeds the active filter into Preact state and
 * keeps the buttons' own pressed styling in sync.
 */
export const useProjectFilter = (): string => {
    const [filter, setFilter] = useState<string>(() => readFilter($(".filter-button.active")));

    useEffect(() => {
        const container = $(".project-filters");
        if (!container) {
            warn(SCOPE, "Filter container .project-filters not found; filtering disabled");
            return;
        }

        return listen(container, "click", (event) => {
            const button = (event.target as Element | null)?.closest<HTMLElement>(".filter-button");
            if (!button || !container.contains(button)) return;

            for (const candidate of $$<HTMLElement>(".filter-button", container)) {
                const selected = candidate === button;
                candidate.classList.toggle("active", selected);
                candidate.setAttribute("aria-pressed", String(selected));
            }

            setFilter(readFilter(button));
        });
    }, []);

    return filter;
};
