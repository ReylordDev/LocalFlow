import { useEffect, useState } from "react";

/**
 * Hook to manage and access the application's locale setting
 *
 * @returns The current application locale (e.g., "en-US")
 */
export function useLocale() {
  const [locale, setLocale] = useState("en-US");

  useEffect(() => {
    window.settings
      .getLocale()
      .then((locale) => {
        console.debug("Updated Locale: ", locale);
        setLocale(locale);
      })
      .catch((error) => {
        console.error("Failed to get locale:", error);
        // Fallback to default locale already set in state
      });
  }, []);

  return locale;
}
