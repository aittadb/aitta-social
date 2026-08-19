"use client";

import * as React from "react";

import type { Locale } from "./config";
import type { Messages } from "./messages/en";

export type I18nContextValue = {
  locale: Locale;
  messages: Messages;
};

export const I18nContext = React.createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside an I18nProvider");
  }
  return context;
}
