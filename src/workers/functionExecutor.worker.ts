/**
 * Web Worker for executing dynamically generated functions
 * Used to execute AI-generated heliostat layout functions safely off the main thread
 *
 * Note: This worker cannot protect against infinite loops internally due to JavaScript's
 * single-threaded nature. The calling code must implement timeout protection by terminating
 * the worker if it doesn't respond within the expected time.
 */

self.onmessage = (e: MessageEvent) => {
  const { functionCode } = e.data;

  try {
    // Execute the function code in the worker context
    const fn = new Function(functionCode);
    const result = fn();
    console.log('Worker executed function successfully');

    self.postMessage({
      success: true,
      data: result,
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
