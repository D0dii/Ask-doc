import { client } from "@/client/client.gen";
import { authControllerRefresh } from "@/client/sdk.gen";

let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts to refresh the access token using the generated client.
 * Returns true if refresh was successful, false otherwise.
 */
async function refreshToken(): Promise<boolean> {
  try {
    const response = await authControllerRefresh();
    return response.response.ok;
  } catch {
    return false;
  }
}

/**
 * Sets up the API client with:
 * - Base URL from environment
 * - Credentials for cookies
 * - Response interceptor for automatic token refresh on 401
 */
export function setupApiClient() {
  // Configure base settings
  client.setConfig({
    baseUrl: import.meta.env.VITE_backend_url,
    credentials: "include",
    throwOnError: true,
  });

  console.log("Setting up API client interceptors");

  // Add response interceptor for handling 401 errors
  client.interceptors.response.use(async (response, request) => {
    // If not a 401, return as-is
    if (response.status !== 401) {
      return response;
    }
    console.log("Interceptor: Got 401, checking if should refresh...");
    // Don't try to refresh for auth endpoints that would cause infinite loops
    const url = new URL(request.url);
    if (url.pathname.includes("/auth/refresh") || url.pathname.includes("/auth/logout")) {
      console.log("Interceptor: Skipping refresh for auth endpoint");
      return response;
    }

    // If already refreshing, wait for that promise instead of starting a new one
    // This prevents multiple concurrent refresh requests when several API calls fail simultaneously
    if (!refreshPromise) {
      refreshPromise = refreshToken();
    }

    try {
      const success = await refreshPromise;
      if (success) {
        return await fetch(request, { credentials: "include" });
      } else {
        return response;
      }
    } finally {
      refreshPromise = null;
    }
  });
}
