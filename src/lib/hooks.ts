import { useEffect, useState } from "react";
import { AppSettings } from "../lib/models";
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>();

  useEffect(() => {
    window.settings.getAll().then((settings) => {
      console.log("Initial settings: ", settings);
      setSettings(settings);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = window.settings.onSettingsChanged((settings) => {
      console.log("Settings changed: ", settings);
      setSettings(settings);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return settings;
}
