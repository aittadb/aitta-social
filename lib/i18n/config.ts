export const locales = ["en", "fi"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE_NAME = "aitta-locale";
