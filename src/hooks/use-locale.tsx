import { useEffect, useState } from "react";

export function useLocale() {
  const [locale, setLocale] = useState<string>("en-US");

  useEffect(() => {
    window.settings.getLocale().then((locale) => {
      console.log("Updated Locale: ", locale);
      setLocale(locale);
    });
  }, []);

  return locale;
}
