import { describe, test } from "bun:test";

describe("Milkdown integration", () => {
  test("PureScript integration tests", async () => {
    const { main } = await import("../output/Test.Main/index.js");
    // main() launches an Aff fiber via launchAff_. If it throws,
    // the error surfaces asynchronously via setTimeout.
    // We wrap in a promise that rejects on any unhandled error.
    await new Promise((resolve, reject) => {
      const origSetTimeout = globalThis.setTimeout;
      globalThis.setTimeout = (fn, ms) => {
        return origSetTimeout(() => {
          try {
            fn();
          } catch (e) {
            reject(e);
          }
        }, ms);
      };
      try {
        main();
      } catch (e) {
        reject(e);
      }
      // Restore and resolve after Aff fiber completes
      origSetTimeout(() => {
        globalThis.setTimeout = origSetTimeout;
        resolve();
      }, 5000);
    });
  }, 10000);
});
