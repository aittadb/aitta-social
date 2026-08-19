"use client";

import * as React from "react";

import type { I18nContextValue } from "./context";
import { I18nContext } from "./context";

export function I18nProvider({
  locale,
  messages,
  children,
}: I18nContextValue & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}
