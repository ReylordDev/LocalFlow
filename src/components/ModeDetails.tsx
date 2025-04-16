import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronLeft, Trash2, Wand } from "lucide-react";
import { Separator } from "./ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { cn, tryCatch } from "../lib/utils";
import { Combobox } from "./combobox";
import {
  Mode,
  ModeUpdate,
  VoiceModel,
  LanguageModel,
  languageNameMap,
  LanguageType,
  Language,
} from "../lib/models/database";
import { PromptDetails } from "./PromptDetails";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { useModeStore } from "../stores/mode-store";
import { ModeSpecificTextReplacements } from "./ModeSpecificTextReplacements";
import { UUID } from "crypto";

const menuItemClass = "justify-between items-center flex px-4 min-h-[50px]";

interface ModeDetailsProps {
  setIndex: (index: number) => void;
  voiceModels: VoiceModel[];
  languageModels: LanguageModel[];
}

export function ModeDetails({
  setIndex,
  voiceModels,
  languageModels,
}: ModeDetailsProps) {
  const [showPromptDialog, setShowPromptDialog] = useState(false);

  const {
    mode,
    modeName,
    voiceModelName,
    voiceLanguage,
    translateToEnglish,
    useAi,
    languageModelName,
    prompt,
    textReplacements,
    setMode,
    setModeName,
    setVoiceModelName,
    setVoiceLanguage,
    setTranslateToEnglish,
    setUseAi,
    setLanguageModelName,
    hasUnsavedChanges,
    isValid,
    getChangedFields,
  } = useModeStore();

  const selectedVoiceModel = voiceModels.find(
    (model) => model.name === voiceModelName,
  );

  const createModeUpdate = (modeId: UUID) => {
    if (!mode) {
      throw new Error("Mode is not defined");
    }
    const modeUpdate: ModeUpdate = { id: modeId };

    const addProperty = (key: keyof ModeUpdate, value: unknown) => {
      (modeUpdate[key] as typeof value) = value;
      return addProperty; // Return the function for chaining
    };

    const build = () => modeUpdate; // Finalize the object

    return { addProperty, build };
  };

  const handleSaveMode = async () => {
    if (!isValid()) return;

    if (mode) {
      const changedFields = getChangedFields();
      const updateData: Record<keyof ModeUpdate, unknown> = {
        name: modeName,
        active: false,
        default: false,
        record_system_audio: false,
        id: mode?.id,
        voice_model_name: voiceModelName,
        voice_language: voiceLanguage,
        translate_to_english: translateToEnglish,
        text_replacements: textReplacements,
        use_language_model: useAi,
        language_model_name: languageModelName,
        prompt: {
          system_prompt: prompt?.system_prompt,
          include_clipboard: prompt?.include_clipboard,
          include_active_window: prompt?.include_active_window,
          examples: prompt?.examples,
        },
      };
      const modeBuilder = createModeUpdate(mode.id);
      changedFields.forEach((key) => {
        // TODO: handle the prompt better because currently it is adding the whole object
        modeBuilder.addProperty(key, updateData[key]);
      });
      const modeUpdate = modeBuilder.build();

      const { data: modes, error } = await tryCatch(
        window.database.modes.updateMode(modeUpdate),
      );
      if (error) {
        console.error("Error updating mode:", error);
        return;
      }
      setMode(modes.find((m: Mode) => m.id === mode.id) || null);
    } else {
      const { data: mode, error } = await tryCatch(
        window.database.modes.createMode({
          name: modeName,
          active: false,
          default: false,
          record_system_audio: false,
          use_language_model: useAi,
          text_replacements: textReplacements,
          voice_model_name: voiceModelName,
          voice_language: voiceLanguage,
          translate_to_english: translateToEnglish,
          language_model_name: languageModelName,
          prompt,
        }),
      );
      if (error) {
        console.error("Error updating mode:", error);
        return;
      }
      setMode(mode);
    }
  };

  // Set initial mode data or reset for new mode
  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  return (
    <>
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-l from-sky-300 to-sky-600 px-4 text-white">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-sky-700 hover:text-white"
              onClick={() => setIndex(0)}
            >
              <ChevronLeft className="size-8" />
            </Button>
            <h1 className="py-5 text-2xl font-bold">
              {mode?.name || "Create a new Mode"}
            </h1>
          </div>
          <Button
            variant="secondary"
            className={cn(
              "mr-4",
              mode && hasUnsavedChanges() && "border-2 border-rose-400",
            )}
            disabled={!isValid()}
            onClick={handleSaveMode}
          >
            {mode && hasUnsavedChanges() && (
              <Badge variant="destructive" className="text-xs font-normal">
                Unsaved changes
              </Badge>
            )}
            {mode ? "Save Mode" : "Create Mode"}
          </Button>
        </div>

        {/* Content */}
        <div className="scrollbar flex h-full flex-col gap-6 overflow-y-auto bg-zinc-50 px-8 py-8">
          {/* Mode Name */}
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Details</h2>
            <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
              <div className={cn(menuItemClass)}>
                <h3 className="text-md font-semibold">Name</h3>
                <Input
                  className={cn(
                    "max-w-[300px]",
                    modeName && "text-lg font-medium",
                  )}
                  placeholder="Mode name"
                  value={modeName}
                  onChange={(e) => setModeName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Voice Model Settings */}
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Voice model</h2>
            <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
              <div className={cn(menuItemClass)}>
                <h3 className="text-md font-semibold">Model</h3>
                <Combobox
                  items={voiceModels.map((model) => ({
                    value: model.name,
                    label: model.name,
                  }))}
                  initialMessage="Select a model..."
                  noMatchesMessage="No models found"
                  searchPlaceholder="Search for a model"
                  value={voiceModelName}
                  setValue={(value) => {
                    // This typecast means that it is vital that the value type for all items is of the VoiceModelType.
                    setVoiceModelName(value as VoiceModel["name"]);
                  }}
                />
              </div>
              <Separator orientation="horizontal" />
              <div className={cn(menuItemClass)}>
                <h3 className="text-md font-semibold">Language</h3>
                <Combobox
                  items={
                    selectedVoiceModel?.language === "english-only"
                      ? [
                          {
                            value: Language.en,
                            label: languageNameMap[Language.en],
                          },
                        ]
                      : [
                          {
                            value: Language.auto,
                            label: languageNameMap[Language.auto],
                          },
                          {
                            value: Language.en,
                            label: languageNameMap[Language.en],
                          },
                          {
                            value: Language.de,
                            label: languageNameMap[Language.de],
                          },
                          {
                            value: Language.fr,
                            label: languageNameMap[Language.fr],
                          },
                          {
                            value: Language.it,
                            label: languageNameMap[Language.it],
                          },
                          {
                            value: Language.es,
                            label: languageNameMap[Language.es],
                          },
                          {
                            value: Language.pt,
                            label: languageNameMap[Language.pt],
                          },
                          {
                            value: Language.hi,
                            label: languageNameMap[Language.hi],
                          },
                          {
                            value: Language.th,
                            label: languageNameMap[Language.th],
                          },
                        ]
                  }
                  value={voiceLanguage}
                  setValue={(value) => {
                    // This typecast means that it is vital that the value type for all items is of the Language enum.
                    setVoiceLanguage(value as LanguageType);
                  }}
                  initialMessage="Select a language..."
                  noMatchesMessage="No languages found"
                  searchPlaceholder="Search for a language"
                  disabled={!selectedVoiceModel}
                />
              </div>
              <Separator orientation="horizontal" />
              <div className={cn(menuItemClass)}>
                <h3 className="text-md font-semibold">Translate to English</h3>
                <Switch
                  disabled={voiceLanguage === "en"}
                  checked={translateToEnglish}
                  onCheckedChange={setTranslateToEnglish}
                />
              </div>
            </div>
          </div>

          {/* Language Model Settings */}
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Language model</h2>
            <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
              <div className={cn(menuItemClass)}>
                <div className="flex items-center gap-3">
                  <Wand size={24} />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-md font-semibold">Enable AI</h3>
                    <p className="text-sm font-medium">
                      Turn your dictated text into anything
                    </p>
                  </div>
                </div>
                <Switch checked={useAi} onCheckedChange={setUseAi} />
              </div>
              <Separator orientation="horizontal" />
              <div className={cn(menuItemClass, !useAi && "opacity-50")}>
                <h3 className="text-md font-semibold">Model</h3>
                <Combobox
                  items={languageModels.map((model) => ({
                    value: model.name,
                    label: model.name,
                  }))}
                  value={languageModelName}
                  setValue={setLanguageModelName}
                  initialMessage="Select a model..."
                  noMatchesMessage="No models found"
                  searchPlaceholder="Search for a model"
                  disabled={!useAi}
                />
              </div>
              <Separator orientation="horizontal" />
              <div className={cn(menuItemClass, !useAi && "opacity-50")}>
                <div className="flex w-3/4 shrink flex-col gap-1 sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] xl:max-w-full">
                  <h3 className="text-md font-semibold">Prompt</h3>
                  <p className="truncate text-gray-500">
                    {prompt ? prompt.system_prompt : "No prompt selected."}
                  </p>
                </div>
                <Button
                  onClick={() => setShowPromptDialog(true)}
                  disabled={!useAi}
                >
                  Change prompt...
                </Button>
              </div>
            </div>
          </div>

          {/* Text Replacements */}
          <ModeSpecificTextReplacements />

          {/* Danger Zone */}
          {mode && !mode.default && (
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">Danger Zone</h2>
              <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
                <div className={cn(menuItemClass)}>
                  <h3 className="text-md font-semibold">Delete Mode</h3>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button
                            className="bg-red-500 text-zinc-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-900/90"
                            variant="destructive"
                            onClick={() => {
                              window.database.modes.deleteMode(mode.id);
                              setIndex(0);
                            }}
                          >
                            Delete Mode
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showPromptDialog && (
        <PromptDetails hidePromptDialog={() => setShowPromptDialog(false)} />
      )}
    </>
  );
}
