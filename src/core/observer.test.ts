import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ObserverManager from "./observer";

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root = null;
  readonly rootMargin: string;
  readonly scrollMargin = "0px";
  readonly thresholds: ReadonlyArray<number>;
  readonly observed = new Set<Element>();
  disconnected = false;
  #callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.#callback = callback;
    this.rootMargin = options.rootMargin ?? "0px";
    this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold ?? 0];
    MockIntersectionObserver.instances.push(this);
  }

  observe = vi.fn((target: Element): void => {
    this.observed.add(target);
  });

  unobserve = vi.fn((target: Element): void => {
    this.observed.delete(target);
  });

  disconnect = vi.fn((): void => {
    this.disconnected = true;
    this.observed.clear();
  });

  takeRecords = (): IntersectionObserverEntry[] => [];

  intersect(target: Element, isIntersecting: boolean): void {
    this.#callback([{ target, isIntersecting } as IntersectionObserverEntry], this);
  }
}

describe("ObserverManager", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("observes reveal elements just before they enter the viewport and unobserves after reveal", () => {
    const element = document.createElement("div");
    element.dataset.reveal = "";
    document.body.append(element);

    const manager = new ObserverManager();
    const observer = MockIntersectionObserver.instances[0];

    expect(observer.rootMargin).toBe("0px 0px 160px 0px");
    expect(observer.thresholds).toEqual([0]);
    expect(observer.observed.has(element)).toBe(true);

    observer.intersect(element, false);
    expect(element.classList.contains("revealed")).toBe(false);

    observer.intersect(element, true);
    expect(element.classList.contains("revealed")).toBe(true);
    expect(observer.observed.has(element)).toBe(false);
    expect(observer.unobserve).toHaveBeenCalledWith(element);

    manager.destroy();
  });

  it("merges custom options with the default intersection settings", () => {
    const manager = new ObserverManager({ rootMargin: "20px", threshold: 0.5 });
    const observer = MockIntersectionObserver.instances[0];

    expect(observer.rootMargin).toBe("20px");
    expect(observer.thresholds).toEqual([0.5]);

    manager.destroy();
  });

  it("avoids duplicate observation and accepts dynamically registered targets", () => {
    const first = document.createElement("div");
    const second = document.createElement("div");
    first.dataset.reveal = "";
    document.body.append(first, second);

    const manager = new ObserverManager();
    const observer = MockIntersectionObserver.instances[0];

    manager.observe(first);
    manager.observe([first, second]);

    expect(observer.observe).toHaveBeenCalledTimes(2);
    expect(observer.observed.has(second)).toBe(true);

    manager.destroy();
  });

  it("untracks manually observed descendants when their parent is removed", async () => {
    const root = document.createElement("main");
    root.id = "root";
    const parent = document.createElement("div");
    const target = document.createElement("span");
    parent.append(target);
    root.append(parent);
    document.body.append(root);

    const manager = new ObserverManager();
    const observer = MockIntersectionObserver.instances[0];

    manager.observe(target);
    expect(observer.observed.has(target)).toBe(true);

    parent.remove();
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

    expect(observer.observed.has(target)).toBe(false);
    expect(observer.unobserve).toHaveBeenCalledWith(target);

    manager.destroy();
  });

  it("automatically observes reveal elements added under the app root", async () => {
    const root = document.createElement("main");
    root.id = "root";
    document.body.append(root);

    const manager = new ObserverManager();
    const observer = MockIntersectionObserver.instances[0];
    const dynamicElement = document.createElement("div");
    dynamicElement.dataset.reveal = "";
    root.append(dynamicElement);

    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

    expect(observer.observed.has(dynamicElement)).toBe(true);

    manager.destroy();
  });

  it("reveals eagerly when reduced motion is enabled", () => {
    const element = document.createElement("div");
    element.dataset.reveal = "";
    document.body.append(element);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );

    const manager = new ObserverManager();

    expect(element.classList.contains("revealed")).toBe(true);
    expect(MockIntersectionObserver.instances).toHaveLength(0);

    manager.destroy();
  });

  it("reveals eagerly when IntersectionObserver is unavailable", () => {
    const element = document.createElement("div");
    element.dataset.reveal = "";
    document.body.append(element);
    vi.stubGlobal("IntersectionObserver", undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const manager = new ObserverManager();

    expect(element.classList.contains("revealed")).toBe(true);
    expect(MockIntersectionObserver.instances).toHaveLength(0);

    manager.destroy();
  });

  it("disconnects and ignores new targets after destruction", () => {
    const element = document.createElement("div");
    element.dataset.reveal = "";
    document.body.append(element);

    const manager = new ObserverManager();
    const observer = MockIntersectionObserver.instances[0];

    manager.destroy();
    observer.intersect(element, true);
    manager.observe(element);

    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(observer.observe).toHaveBeenCalledOnce();
    expect(element.classList.contains("revealed")).toBe(false);
  });
});
