/**
 * Resolves the Rust backend base URL (no trailing slash).
 *
 * Never use localhost on Vercel — rewrites/proxies would hang until TCP timeout.
 */
export function resolveBackendUrl(): string {
  const fromEnv = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv?.trim()) {
    return fromEnv.trim().replace(/\/$/, "");
  }

  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return "https://mvr-umqq.onrender.com";
  }

  return "http://localhost:8080";
}
