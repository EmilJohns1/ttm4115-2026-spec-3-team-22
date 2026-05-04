const isDev = __DEV__;

export const logger = {
  log: (...args: unknown[]) => isDev && console.log("[log]", ...args),
  warn: (...args: unknown[]) => isDev && console.warn("[warn]", ...args),
  error: (...args: unknown[]) => isDev && console.error("[error]", ...args),
};
