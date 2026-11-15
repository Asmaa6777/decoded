import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Node 22+ defines globalThis.localStorage as undefined without --localstorage-file,
// which shadows jsdom's storage when accessed as a bare identifier.
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, String(value));
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
  get length() {
    return storage.size;
  },
  key: (i: number) => Array.from(storage.keys())[i] ?? null,
};

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// jsdom lacks ResizeObserver; ReactFlow's ZoomPane uses it. No-op is enough.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;

// jsdom lacks DOMMatrixReadOnly used internally by ReactFlow viewport math.
const globalAny = globalThis as unknown as { DOMMatrixReadOnly?: unknown };
if (!globalAny.DOMMatrixReadOnly) {
  class DOMMatrixReadOnlyStub {
    m22 = 1;
  }
  globalAny.DOMMatrixReadOnly = DOMMatrixReadOnlyStub;
}
