/**
 * Environment Flag: Is Platform
 * Indicates if the app is running in Platform mode (hosted) or OSS mode (self-hosted)
 */
export const IS_PLATFORM = process.env.VITE_IS_PLATFORM === 'true';

/**
 * Development-only auth bypass for local manual UAT and debugging.
 * This stays off unless the env var is explicitly set to the string 'true'.
 */
export const IS_DEV_AUTO_LOGIN = process.env.VITE_DEV_AUTO_LOGIN === 'true';
