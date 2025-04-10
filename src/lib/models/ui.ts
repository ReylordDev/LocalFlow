// UI-specific models and types

// Page navigation constants
export const pages = [
  "Modes",
  "Text Replacements",
  "Configuration",
  "Audio",
  "Recording History",
  "Credits",
] as const;

export type Page = (typeof pages)[number];
