export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL?.trim();
  const appId = import.meta.env.VITE_APP_ID?.trim();

  if (!oauthPortalUrl || !appId) {
    const callbackUrl = new URL("/api/oauth/callback", origin);
    callbackUrl.searchParams.set("code", "demo");
    callbackUrl.searchParams.set("state", "dev");
    return callbackUrl.toString();
  }

  const redirectUri = `${origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch {
    return `${origin}/login`;
  }
};

export const navigateTo = (target: string) => {
  if (typeof window === "undefined") return;

  if (!target) return;

  const isExternal = /^https?:\/\//i.test(target);

  if (isExternal) {
    window.location.assign(target);
    return;
  }

  const resolvedTarget = target.startsWith("/") ? target : `/${target}`;
  window.location.assign(resolvedTarget);
};

export const navigateToLogin = () => navigateTo(getLoginUrl());
