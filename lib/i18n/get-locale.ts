import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale, LOCALE_COOKIE_NAME } from "./config";

const CHATGPT_LOCALE_HEADERS = [
  "x-chatgpt-user-locale",
  "x-vercel-locale",
  "x-oai-locale",
  "oai-locale",
];

export async function getLocale(): Promise<Locale> {
  try {
    const preference = await getExplicitLocalePreference();
    if (preference) return preference;

    const requestHeaders = await headers();
    const acceptedLanguageHeader = requestHeaders.get("accept-language");
    const acceptedLanguage = pickLocale(acceptedLanguageHeader);
    if (acceptedLanguage) return acceptedLanguage;
  } catch {
    return defaultLocale;
  }

  return defaultLocale;
}

export async function getExplicitLocalePreference(): Promise<Locale | null> {
  try {
    const requestCookies = await cookies();
    const cookieLocale = requestCookies.get(LOCALE_COOKIE_NAME)?.value ?? null;
    const fromCookie = pickLocale(cookieLocale);
    if (fromCookie) return fromCookie;

    const requestHeaders = await headers();
    for (const headerName of CHATGPT_LOCALE_HEADERS) {
      const value = requestHeaders.get(headerName);
      const resolved = pickLocale(value ?? null);
      if (resolved) return resolved;
    }
  } catch {
    return null;
  }

  return null;
}

function pickLocale(rawValue: string | null): Locale | null {
  if (!rawValue) return null;

  const candidates = rawValue
    .split(",")
    .map((entry) => entry.trim().split(";")[0].trim().toLowerCase())
    .filter(Boolean);

  for (const candidate of candidates) {
    const normalized = candidate.replace("_", "-");
    const [lang] = normalized.split("-", 1);
    const short = lang.toLowerCase();

    const locale = locales.find((available) => available === normalized || available === short);
    if (locale) return locale;
  }

  return null;
}
