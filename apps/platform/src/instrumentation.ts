export async function register() {
  if (process.env.NEXT_SERVER_COMPONENT_STRICT_MODE_ENABLED !== undefined) return;
  // Run on Node.js server only, not during edge runtime
  if (process.env.NEXT_RUNTIME === "nodejs" || !process.env.NEXT_RUNTIME) {
    await import("./lib/env");
  }
}
