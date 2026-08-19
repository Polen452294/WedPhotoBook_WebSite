export const COOKIE_CONSENT_KEY = "wedfotobook-cookie-consent-v2";
export const COOKIE_CONSENT_EVENT = "wedfotobook:cookie-consent-changed";
export const COOKIE_CONSENT_VERSION = 2;

const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type CookieConsent = {
  version: typeof COOKIE_CONSENT_VERSION;
  necessary: true;
  analytics: boolean;
  updatedAt: string;
};

export function readCookieConsent(): CookieConsent | null {
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<CookieConsent>;
    const updatedAt = Date.parse(value.updatedAt ?? "");
    if (
      value.version !== COOKIE_CONSENT_VERSION ||
      value.necessary !== true ||
      typeof value.analytics !== "boolean" ||
      !Number.isFinite(updatedAt) ||
      Date.now() - updatedAt > CONSENT_MAX_AGE_MS
    ) return null;
    return value as CookieConsent;
  } catch {
    return null;
  }
}

export function saveCookieConsent(analytics: boolean): CookieConsent {
  const consent: CookieConsent = {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    window.localStorage.removeItem("wedfotobook-cookie-consent");
  } catch {
    // The selected preference still applies for the current page.
  }
  window.dispatchEvent(new CustomEvent<CookieConsent>(COOKIE_CONSENT_EVENT, { detail: consent }));
  return consent;
}
