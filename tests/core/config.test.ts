import { describe, it, expect } from 'vitest';
import { CONFIG } from '../../js/core/config.js';

describe('core/config', () => {
    it('exposes every key the modules depend on', () => {
        expect(Object.keys(CONFIG).sort()).toEqual([
            'ACTIVE_SECTION_OFFSET',
            'HEADER_HEIGHT',
            'MOBILE_BREAKPOINT',
            'OBSERVER_ROOT_MARGIN',
            'OBSERVER_THRESHOLD',
            'SCROLL_TICK_RATE',
            'SCROLL_TOP_THRESHOLD',
            'STORAGE_THEME_KEY',
        ]);
    });

    it('keeps the observer threshold within a valid ratio range', () => {
        expect(CONFIG.OBSERVER_THRESHOLD).toBeGreaterThan(0);
        expect(CONFIG.OBSERVER_THRESHOLD).toBeLessThanOrEqual(1);
    });

    it('uses positive pixel values for layout offsets', () => {
        expect(CONFIG.HEADER_HEIGHT).toBeGreaterThan(0);
        expect(CONFIG.MOBILE_BREAKPOINT).toBeGreaterThan(0);
        expect(CONFIG.ACTIVE_SECTION_OFFSET).toBeGreaterThan(0);
        expect(CONFIG.SCROLL_TICK_RATE).toBeGreaterThan(0);
        expect(CONFIG.SCROLL_TOP_THRESHOLD).toBeGreaterThan(0);
    });

    it('is frozen so modules cannot mutate shared configuration', () => {
        expect(Object.isFrozen(CONFIG)).toBe(true);
        expect(() => {
            (CONFIG as { HEADER_HEIGHT: number }).HEADER_HEIGHT = 999;
        }).toThrow(TypeError);
        expect(CONFIG.HEADER_HEIGHT).toBe(76);
    });
});
