import { useEffect, useState } from "react";
import { AppSettings } from "../lib/models";
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>();

  useEffect(() => {
    window.settings.getAll().then((settings) => {
      setSettings(settings);
    });
  }, []);

  return settings;
}
