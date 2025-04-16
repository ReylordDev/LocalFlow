import {
  LanguageType,
  Mode,
  ModeUpdate,
  PromptBase,
  TextReplacementBase,
  VoiceModelType,
} from "../lib/models/database";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ModeState {
  // Current mode data
  mode: Mode | null;
  modeName: string;
  voiceModelName: VoiceModelType;
  voiceLanguage: LanguageType;
  translateToEnglish: boolean;
  useAi: boolean;
  languageModelName: string;
  prompt: PromptBase | undefined;
  textReplacements: TextReplacementBase[];

  // Actions
  setMode: (mode: Mode | null) => void;
  setModeName: (modeName: string) => void;
  setVoiceModelName: (voiceModelName: VoiceModelType) => void;
  setVoiceLanguage: (voiceLanguage: LanguageType) => void;
  setTranslateToEnglish: (translateToEnglish: boolean) => void;
  setUseAi: (useAi: boolean) => void;
  setLanguageModelName: (languageModelName: string) => void;
  setPrompt: (prompt: PromptBase | undefined) => void;
  setTextReplacements: (textReplacements: TextReplacementBase[]) => void;
  reset: () => void;

  // Computed values
  hasUnsavedChanges: () => boolean;
  isValid: () => boolean;
  getChangedFields: () => (keyof ModeUpdate)[];
}

const initialState: Partial<ModeState> = {
  mode: null,
  modeName: "New Mode",
  voiceModelName: "distil-large-v3",
  voiceLanguage: "auto",
  translateToEnglish: false,
  useAi: false,
  languageModelName: "",
  prompt: undefined,
  textReplacements: [],
};

export const useModeStore = create<ModeState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Actions
      setMode: (mode) => {
        if (mode) {
          set({
            mode,
            modeName: mode.name,
            voiceModelName: mode.voice_model.name,
            voiceLanguage: mode.voice_language,
            translateToEnglish: mode.translate_to_english,
            useAi: mode.use_language_model,
            languageModelName: mode.language_model?.name ?? "",
            prompt: mode.prompt ?? undefined,
            textReplacements: mode.text_replacements ?? [],
          });
        } else {
          get().reset();
        }
      },

      setModeName: (modeName) => set({ modeName }),
      setVoiceModelName: (voiceModelName) => set({ voiceModelName }),
      setVoiceLanguage: (voiceLanguage) => set({ voiceLanguage }),
      setTranslateToEnglish: (translateToEnglish) =>
        set({ translateToEnglish }),
      setUseAi: (useAi) => set({ useAi }),
      setLanguageModelName: (languageModelName) => set({ languageModelName }),
      setPrompt: (prompt) => set({ prompt }),
      setTextReplacements: (textReplacements) => set({ textReplacements }),

      reset: () => set(initialState),

      // Computed values
      hasUnsavedChanges: () => {
        const state = get();
        const mode = state.mode;

        if (!mode) {
          // If no mode is set, we are in "create" mode
          return false;
        }

        // For existing modes, compare current values with original mode
        return state.getChangedFields().length > 0;
      },

      isValid: () => {
        const state = get();
        const requiredFieldsValid =
          state.modeName.length > 0 &&
          state.voiceModelName.length > 0 &&
          state.voiceLanguage.length > 0;

        if (!state.useAi) {
          return requiredFieldsValid;
        }

        return requiredFieldsValid && state.languageModelName.length > 0;
      },

      getChangedFields: () => {
        const state = get();
        const mode = state.mode;
        if (!mode) return [];

        const changes: (keyof ModeUpdate)[] = [];

        if (mode.name !== state.modeName) changes.push("name");
        if (mode.voice_model.name !== state.voiceModelName)
          changes.push("voice_model_name");
        if (mode.voice_language !== state.voiceLanguage)
          changes.push("voice_language");
        if (mode.translate_to_english !== state.translateToEnglish)
          changes.push("translate_to_english");
        if (mode.use_language_model !== state.useAi)
          changes.push("use_language_model");
        if (state.useAi) {
          if (mode.language_model?.name !== state.languageModelName)
            changes.push("language_model_name");
          const promptChanges: string[] = [];
          if (mode.prompt?.system_prompt !== state.prompt?.system_prompt) {
            promptChanges.push("system_prompt");
          }
          if (
            mode.prompt?.include_clipboard !== state.prompt?.include_clipboard
          ) {
            promptChanges.push("include_clipboard");
          }
          if (
            mode.prompt?.include_active_window !==
            state.prompt?.include_active_window
          ) {
            promptChanges.push("include_active_window");
          }
          if (mode.prompt?.examples !== state.prompt?.examples) {
            promptChanges.push("examples");
          }
          if (promptChanges.length > 0) {
            changes.push("prompt");
          }
        }
        if (
          // Check if the text replacements are different
          // important: mode.text_replacements is of type TextReplacement[], while state.textReplacements is of type TextReplacementBase[]
          // We only compare the TextReplacementBase properties (original_text and replacement_text)
          mode.text_replacements.length !== state.textReplacements.length ||
          mode.text_replacements.some(
            (tr, index) =>
              tr.original_text !==
                state.textReplacements[index].original_text ||
              tr.replacement_text !==
                state.textReplacements[index].replacement_text,
          )
        )
          changes.push("text_replacements");

        if (changes.length > 0) {
          // Convert changes into a debug-friendly format that shows old and new values
          const changedValues = changes.reduce<
            Record<string, { old: unknown; new: unknown }>
          >((acc, field) => {
            switch (field) {
              case "name":
                acc[field] = { old: mode.name, new: state.modeName };
                break;
              case "voice_model_name":
                acc[field] = {
                  old: mode.voice_model.name,
                  new: state.voiceModelName,
                };
                break;
              case "voice_language":
                acc[field] = {
                  old: mode.voice_language,
                  new: state.voiceLanguage,
                };
                break;
              case "translate_to_english":
                acc[field] = {
                  old: mode.translate_to_english,
                  new: state.translateToEnglish,
                };
                break;
              case "use_language_model":
                acc[field] = { old: mode.use_language_model, new: state.useAi };
                break;
              case "language_model_name":
                acc[field] = {
                  old: mode.language_model?.name,
                  new: state.languageModelName,
                };
                break;
              case "prompt":
                acc[field] = { old: mode.prompt, new: state.prompt };
                break;
              case "text_replacements":
                acc[field] = {
                  old: mode.text_replacements,
                  new: state.textReplacements,
                };
                break;
            }
            return acc;
          }, {});
          console.debug("Unsaved changes:", changedValues);
        }

        return changes;
      },
    }),
    { name: "mode-store" },
  ),
);
