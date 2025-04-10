import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "../main-process/services/settings-service";

/**
 * A hook that provides access to the application settings.
 *
 * This hook fetches the initial settings when mounted and subscribes to setting changes.
 * Any changes to settings made elsewhere in the application will automatically update
 * the returned settings object.
 *
 * @returns The current application settings
 *
 * @example
 * ```tsx
 * function SettingsDisplay() {
 *   const settings = useSettings();
 *
 *   return (
 *     <div>
 *       <h1>Current Settings</h1>
 *       <pre>{JSON.stringify(settings, null, 2)}</pre>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    window.settings.getAll().then((settings) => {
      console.debug("Initial settings: ", settings);
      setSettings(settings);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = window.settings.onSettingsChanged((settings) => {
      console.debug("Settings changed: ", settings);
      setSettings(settings);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return settings;
}
