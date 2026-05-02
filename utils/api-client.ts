import { API_URL } from "@/constants/env";
import type { paths } from "@/openapi";
import createClient, { type Middleware } from "openapi-fetch";

let _accessToken: string | null = null;
let _refreshToken: string | null = null;
let _onUnauthenticated: (() => void) | null = null;
let _onTokensRefreshed:
  | ((tokens: {
      accessToken: string;
      refreshToken: string;
      tokenType: string;
    }) => void)
  | null = null;
let _refreshPromise: Promise<boolean> | null = null;

export function setAuthTokens(
  tokens: { accessToken: string; refreshToken: string } | null,
) {
  _accessToken = tokens?.accessToken ?? null;
  _refreshToken = tokens?.refreshToken ?? null;
}

export function setUnauthenticatedHandler(handler: () => void) {
  _onUnauthenticated = handler;
}

export function setTokensRefreshedHandler(
  handler: (tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
  }) => void,
) {
  _onTokensRefreshed = handler;
}

async function attemptTokenRefresh(): Promise<boolean> {
  if (!_refreshToken) {
    return false;
  }
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: _refreshToken }),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      token_type?: string;
    };
    if (!data.access_token || !data.token_type) return false;
    _accessToken = data.access_token;
    // Backend may not rotate the refresh token — keep the existing one if so.
    if (data.refresh_token) _refreshToken = data.refresh_token;
    _onTokensRefreshed?.({
      accessToken: data.access_token,
      refreshToken: _refreshToken!,
      tokenType: data.token_type,
    });
    return true;
  } catch (err) {
    return false;
  }
}

// Cloned before the request body is consumed, used to replay on token refresh.
const requestClones = new WeakMap<Request, Request>();

const authMiddleware: Middleware = {
  onRequest({ request }) {
    requestClones.set(request, request.clone());
    if (_accessToken) {
      request.headers.set("Authorization", `Bearer ${_accessToken}`);
    }
    return request;
  },
  async onResponse({ response, request }) {
    if (response.status !== 401) {
      requestClones.delete(request);
      return response;
    }

    // Deduplicate concurrent refresh attempts.
    if (!_refreshPromise) {
      _refreshPromise = attemptTokenRefresh().finally(() => {
        _refreshPromise = null;
      });
    }
    const refreshed = await _refreshPromise;

    const clone = requestClones.get(request);
    requestClones.delete(request);

    if (refreshed && _accessToken && clone) {
      clone.headers.set("Authorization", `Bearer ${_accessToken}`);
      return fetch(clone);
    }

    _accessToken = null;
    _refreshToken = null;
    _onUnauthenticated?.();
    return response;
  },
};

export const api = createClient<paths>({ baseUrl: API_URL });
api.use(authMiddleware);
