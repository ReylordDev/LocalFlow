import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import {
  ExampleBase,
  LanguageType,
  Mode,
  ModeUpdate,
  PromptBase,
  TextReplacement,
  TextReplacementBase,
  languageNameMap,
} from "../../lib/models";
import { Separator } from "../../components/ui/separator";
import { ChevronLeft, ChevronUp, Trash2, Wand } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { Combobox } from "../../components/combobox";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
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
} from "../../components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../../components/ui/context-menu";

const menuItemClass = "justify-between items-center flex px-4 min-h-[50px]";

export default function Modes() {
  const [modes, setModes] = useState<Mode[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);

  useEffect(() => {
    window.database.modes.requestAll();
  }, [index]);

  useEffect(() => {
    const unsubscribe = window.database.modes.onReceiveModes(
      (modes: Mode[]) => {
        console.log("Received Modes", modes);
        setModes(modes);
      },
    );
    return () => unsubscribe();
  }, [index]);

  if (index === 1) {
    return <ModeDetails mode={selectedMode} setIndex={setIndex} />;
  }

  // if (index === 2) {
  //   return <PromptDetails mode={selectedMode} setIndex={setIndex} />;
  // }

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-y-auto px-32 py-24">
      <div className="flex items-center justify-between">
        <div className="flex min-h-10 max-w-[600px] flex-col gap-1">
          <h1 className="text-xl font-bold">Create a Mode</h1>
          <p className="font-medium">
            Create Modes for Email, Meetings, Notes, Documents, Messaging and
            more.
          </p>
        </div>
        <Button
          className="bg-sky-600 hover:bg-sky-700"
          onClick={() => {
            console.log("Create Mode");
            setIndex(1);
            setSelectedMode(null);
          }}
        >
          New Mode
        </Button>
      </div>
      <Separator orientation="horizontal" />
      <div className="flex flex-col gap-4 pt-1">
        {modes.map((mode, index) => (
          <div
            key={index}
            className="flex h-full items-center justify-between rounded-md border border-zinc-300 bg-zinc-50 p-4"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">{mode.name}</h2>
                {mode.active && (
                  <Badge
                    variant="default"
                    className="bg-zinc-500 text-xs font-normal hover:bg-zinc-500"
                  >
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium">
                {mode.voice_model.name} ({languageNameMap[mode.voice_language]})
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIndex(1);
                  setSelectedMode(mode);
                }}
              >
                Edit
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  modes.map((m) => {
                    window.database.modes.updateMode({
                      id: m.id,
                      active: false,
                    });
                  });
                  window.database.modes.updateMode({
                    id: mode.id,
                    active: true,
                  });
                  console.log("Toggle Mode", mode.id, !mode.active);
                  setModes((prev) =>
                    prev.map((m) => {
                      if (m.id === mode.id) {
                        return { ...m, active: true };
                      } else {
                        return { ...m, active: false };
                      }
                    }),
                  );
                }}
              >
                Activate
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ModeDetails = ({
  mode,
  setIndex,
}: {
  mode: Mode | null;
  setIndex: (index: number) => void;
}) => {
  const [useAi, setUseAi] = useState<boolean>(
    mode ? mode.use_language_model : false,
  );
  const [languageModelName, setLanguageModelName] = useState(
    mode ? mode.language_model?.name : "",
  );
  const [prompt, setPrompt] = useState<PromptBase>(mode ? mode.prompt : null); // TODO: Check the validity
  const [name, setName] = useState<string>(mode ? mode.name : "");
  const [voiceModelName, setVoiceModelName] = useState<string>(
    mode ? mode.voice_model.name : "",
  );
  const [voiceLanguage, setVoiceLanguage] = useState<string>(
    mode ? mode.voice_language : "auto",
  );
  const [translateToEnglish, setTranslateToEnglish] = useState<boolean>(
    mode ? mode.translate_to_english : false,
  );
  const [textReplacements, setTextReplacements] = useState<
    TextReplacement[] | TextReplacementBase[]
  >(mode ? mode.text_replacements : []);
  const [textReplacementInput, setTextReplacementInput] =
    useState<TextReplacementBase>({
      replacement_text: "",
      original_text: "",
    });

  const modelState = useMemo(() => {
    const modelState: Record<keyof ModeUpdate, unknown> = {
      name,
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
    return modelState;
  }, [
    name,
    voiceModelName,
    voiceLanguage,
    translateToEnglish,
    textReplacements,
    useAi,
    languageModelName,
    prompt,
  ]);

  const [showPromptDialog, setShowPromptDialog] = useState<boolean>(false);

  const settingsAreValid = useMemo(() => {
    if (name.length === 0) return false;
    if (!voiceModelName || voiceModelName.length === 0) return false;
    // TODO: validate voice language input

    if (useAi) {
      if (!languageModelName) return false;
    }
    return true;
  }, [name, voiceModelName, voiceLanguage, useAi, languageModelName]);

  const unsavedChanges = useMemo(() => {
    const changedParameters: (keyof ModeUpdate)[] = [];
    if (mode) {
      if (mode.name !== name) {
        changedParameters.push("name");
      }
      if (mode.voice_model.name !== voiceModelName) {
        changedParameters.push("voice_model_name");
      }
      if (mode.voice_language !== voiceLanguage) {
        changedParameters.push("voice_language");
      }
      if (mode.translate_to_english !== translateToEnglish) {
        changedParameters.push("translate_to_english");
      }
      if (mode.text_replacements !== textReplacements) {
        changedParameters.push("text_replacements");
      }
      if (mode.use_language_model !== useAi) {
        changedParameters.push("use_language_model");
      }
      if (useAi) {
        if (mode.language_model?.name !== languageModelName) {
          changedParameters.push("language_model_name");
        }
        const promptParameters: string[] = [];
        if (mode.prompt?.system_prompt !== prompt?.system_prompt) {
          promptParameters.push("system_prompt");
        }
        if (mode.prompt?.include_clipboard !== prompt?.include_clipboard) {
          promptParameters.push("include_clipboard");
        }
        if (
          mode.prompt?.include_active_window !== prompt?.include_active_window
        ) {
          promptParameters.push("include_active_window");
        }
        if (mode.prompt?.examples !== prompt?.examples) {
          promptParameters.push("examples");
        }
        if (promptParameters.length > 0) {
          changedParameters.push("prompt");
        }
      }
    }
    return changedParameters;
  }, [
    mode,
    name,
    useAi,
    voiceModelName,
    voiceLanguage,
    translateToEnglish,
    textReplacements,
    languageModelName,
    prompt,
  ]);

  function handleSaveMode() {
    console.log("Save Mode", {
      name,
      voiceModelName,
      voiceLanguage,
      translateToEnglish,
      textReplacements,
    });
    if (!settingsAreValid) {
      console.log("Settings are not valid");
      return;
    }
    if (mode) {
      const modeBuilder = createModeUpdate();

      // TODO: handle the prompt better because currently it is adding the whole object
      unsavedChanges.forEach((key) => {
        if (key in modelState) {
          modeBuilder.addProperty(key, modelState[key]);
        }
      });

      const modeUpdate = modeBuilder.build();
      window.database.modes.updateMode(modeUpdate);
      console.log("Updated Mode", modeUpdate);
    } else {
      window.database.modes.createMode({
        name,
        active: false,
        default: false,
        record_system_audio: false,
        use_language_model: useAi,
        text_replacements: textReplacements,
        voice_model_name: voiceModelName,
        voice_language: voiceLanguage as LanguageType,
        translate_to_english: translateToEnglish,
        language_model_name: languageModelName,
        prompt: prompt,
      });
    }
    setIndex(0);
  }

  const createModeUpdate = () => {
    const modeUpdate: ModeUpdate = { id: mode?.id };

    const addProperty = (key: keyof ModeUpdate, value: unknown) => {
      (modeUpdate[key] as typeof value) = value;
      return addProperty; // Return the function for chaining
    };

    const build = () => modeUpdate; // Finalize the object

    return { addProperty, build };
  };

  console.log("ModeDetails", mode);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-l from-sky-300 to-sky-600 px-4 text-white">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-sky-700 hover:text-white"
            onClick={() => {
              setIndex(0);
            }}
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
            unsavedChanges.length > 0 && "border-2 border-rose-400",
          )}
          disabled={!settingsAreValid}
          onClick={handleSaveMode}
        >
          {unsavedChanges.length > 0 && (
            <Badge variant="destructive" className="text-xs font-normal">
              Unsaved changes
            </Badge>
          )}
          {mode ? "Save Mode" : "Create Mode"}
        </Button>
      </div>
      <div className="flex h-full flex-col gap-6 overflow-y-auto bg-zinc-50 px-8 py-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Details</h2>
          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Name</h3>
              <Input
                className={cn("max-w-[300px]", name && "text-lg font-medium")}
                placeholder="Mode name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Voice model</h2>
          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Model</h3>
              <Combobox
                items={[
                  {
                    value: "large-v3-turbo",
                    label: "Whisper Large V3 Turbo",
                  },
                  {
                    value: "large-v3",
                    label: "Whisper Large V3",
                  },
                  {
                    value: "distil-large-v3",
                    label: "Whisper Distil Large V3",
                  },
                ]}
                initialMessage="Select a model..."
                noMatchesMessage="No models found"
                searchPlaceholder="Search for a model"
                value={voiceModelName}
                setValue={setVoiceModelName}
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Language</h3>
              <Combobox
                items={[
                  {
                    value: "auto",
                    label: "Automatic",
                  },
                  {
                    value: "en",
                    label: "English",
                  },
                  {
                    value: "es",
                    label: "Spanish",
                  },
                  {
                    value: "fr",
                    label: "French",
                  },
                ]}
                value={voiceLanguage}
                setValue={setVoiceLanguage}
                initialMessage="Select a language..."
                noMatchesMessage="No languages found"
                searchPlaceholder="Search for a language"
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Translate to English</h3>
              <Switch
                disabled={voiceLanguage === "en"}
                checked={translateToEnglish}
                onCheckedChange={(checked) => setTranslateToEnglish(checked)}
              />
            </div>
          </div>
        </div>
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
              <Switch
                checked={useAi}
                onCheckedChange={(checked) => setUseAi(checked)}
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass, !useAi && "opacity-50")}>
              <h3 className="text-md font-semibold">Model</h3>
              {/* TODO: Fetch the available language models */}
              <Combobox
                items={[
                  {
                    value: "gemma3:4b",
                    label: "Gemma 3 (4b)",
                  },
                  {
                    value: "gpt-4",
                    label: "GPT-4",
                  },
                  {
                    value: "gpt-4-32k",
                    label: "GPT-4 32k",
                  },
                  {
                    value: "gpt-4-turbo",
                    label: "GPT-4 Turbo",
                  },
                  {
                    value: "gpt-4-turbo-32k",
                    label: "GPT-4 Turbo 32k",
                  },
                ]}
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
                className="flex-none"
                onClick={() => {
                  // setIndex(2);
                  setShowPromptDialog(true);
                }}
                disabled={!useAi}
              >
                Change prompt...
              </Button>
              {showPromptDialog && (
                <PromptDetails
                  prompt={prompt}
                  setPrompt={setPrompt}
                  hidePromptDialog={() => setShowPromptDialog(false)}
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Text Replacements</h2>
          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
            <div className={cn(menuItemClass, "gap-4")}>
              <Input
                className="w-full"
                placeholder="Original"
                value={textReplacementInput.original_text}
                onChange={(e) =>
                  setTextReplacementInput({
                    ...textReplacementInput,
                    original_text: e.target.value,
                  })
                }
              ></Input>
              <Separator orientation="vertical" className="h-8" />
              <Input
                className="w-full"
                placeholder="Replacement"
                value={textReplacementInput.replacement_text}
                onChange={(e) =>
                  setTextReplacementInput({
                    ...textReplacementInput,
                    replacement_text: e.target.value,
                  })
                }
              ></Input>
              <Separator orientation="vertical" className="h-8" />
              <Button
                variant="default"
                onClick={() => {
                  console.log("Add text replacement", textReplacementInput);
                  setTextReplacements([
                    ...textReplacements,
                    textReplacementInput,
                  ]);
                  setTextReplacementInput({
                    original_text: "",
                    replacement_text: "",
                  });
                }}
              >
                Add
              </Button>
            </div>
            <Separator orientation="horizontal" />
            {/* List the text replacements */}
            <div>
              {textReplacements.length === 0 ? (
                <p className="px-3 py-2 pl-5 text-sm font-medium text-gray-500">
                  No text replacements added.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {textReplacements.map((replacement, index) => (
                    <div key={index} className={cn(menuItemClass, "gap-4")}>
                      <h3 className="text-md w-full px-3 py-2">
                        {replacement.original_text}
                      </h3>
                      <Separator orientation="vertical" className="h-8" />
                      <h3 className="text-md w-full px-3 py-2">
                        {replacement.replacement_text}
                      </h3>
                      <Separator orientation="vertical" className="h-8" />
                      <Button
                        variant="destructive"
                        onClick={() => {
                          console.log("Remove text replacement", index);
                          setTextReplacements((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {mode && !mode?.default && (
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
                              console.log("Delete Mode", mode?.id);
                              window.database.modes.deleteMode(mode?.id);
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
    </div>
  );
};

const PromptDetails = ({
  prompt,
  setPrompt,
  hidePromptDialog,
}: {
  prompt: PromptBase | null;
  setPrompt: (prompt: PromptBase) => void;
  hidePromptDialog: () => void;
}) => {
  const [systemPrompt, setSystemPrompt] = useState<string>(
    prompt ? prompt.system_prompt : "",
  );
  const [includeClipboard, setIncludeClipboard] = useState<boolean>(
    prompt ? prompt.include_clipboard : false,
  );
  const [includeActiveWindow, setIncludeActiveWindow] = useState<boolean>(
    prompt ? prompt.include_active_window : false,
  );
  const [examples, setExamples] = useState<ExampleBase[]>(
    prompt ? prompt.examples : [],
  );
  const [exampleInput, setExampleInput] = useState<string>("");
  const [exampleOutput, setExampleOutput] = useState<string>("");

  const handleSavePrompt = () => {
    console.log("Save Prompt");
    setPrompt({
      ...prompt,
      system_prompt: systemPrompt,
      include_clipboard: includeClipboard,
      include_active_window: includeActiveWindow,
      examples: examples,
    });
  };

  const handleDeleteExample = (index: number) => {
    console.log("Delete example", index);
    setExamples((prev) => prev.filter((_, i) => i !== index));
  };
  const handleDuplicateExample = (example: ExampleBase, index: number) => {
    console.log("Duplicate example", index, example);
    setExamples((prev) => {
      const newExamples = [...prev];
      newExamples.splice(index, 0, example);
      return newExamples;
    });
  };

  console.log("PromptDetails", prompt);

  return (
    <div className="fixed inset-y-0 left-80 right-0 z-50 flex flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-l from-sky-300 to-sky-600 px-4 text-white">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-sky-700 hover:text-white"
            onClick={() => {
              handleSavePrompt();
              hidePromptDialog();
            }}
          >
            <ChevronLeft className="size-8" />
          </Button>
          <h1 className="py-5 text-2xl font-bold">
            {prompt ? "Prompt" : "Create a new Prompt"}
          </h1>
        </div>
      </div>
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-zinc-50 px-8 py-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Prompt</h2>
          <Textarea
            className="h-40"
            placeholder="Enter your prompt here..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Additional Context</h2>
          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
            <div className={cn(menuItemClass)}>
              <div className="flex flex-col gap-1">
                <h3 className="text-md font-semibold">Use copied text</h3>
                <p className="text-sm font-medium">
                  Text copied to the clipboard will be included in the prompt.
                </p>
              </div>
              <Switch
                checked={includeClipboard}
                onCheckedChange={(checked) => setIncludeClipboard(checked)}
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <div className="flex flex-col gap-1">
                <h3 className="text-md font-semibold">Use active window</h3>
                <p className="text-sm font-medium">
                  The active window process and title will be included in the
                  prompt.
                </p>
              </div>
              <Switch
                checked={includeActiveWindow}
                onCheckedChange={(checked) => setIncludeActiveWindow(checked)}
              />
            </div>
          </div>
        </div>
        {!examples || examples.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-md bg-zinc-100 p-4">
            <Wand size={64} />
            <h2 className="text-lg font-semibold">
              Use Examples to enhance AI output
            </h2>
            <p className="text-sm font-medium">
              Add examples of the voice input and AI output. This shows the AI
              what it is supposed to do.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  className="mt-4"
                  onClick={() => {
                    console.log("Add example");
                  }}
                >
                  + Add Example
                </Button>
              </DialogTrigger>
              <AddExampleDialog
                exampleInput={exampleInput}
                setExampleInput={setExampleInput}
                exampleOutput={exampleOutput}
                setExampleOutput={setExampleOutput}
                examples={examples}
                setExamples={setExamples}
              />
            </Dialog>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Examples</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="h-7" variant="outline">
                    + Add Example
                  </Button>
                </DialogTrigger>
                <AddExampleDialog
                  exampleInput={exampleInput}
                  setExampleInput={setExampleInput}
                  exampleOutput={exampleOutput}
                  setExampleOutput={setExampleOutput}
                  examples={examples}
                  setExamples={setExamples}
                />
              </Dialog>
            </div>
            {examples.map((example, index) => (
              <ContextMenu key={index}>
                <ContextMenuTrigger className="w-full">
                  <Dialog>
                    <DialogTrigger className="w-full">
                      <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2 hover:bg-zinc-100">
                        <div className={cn(menuItemClass)}>
                          <div className="flex w-full items-center gap-2">
                            <h3 className="text-md shrink-0 font-semibold">
                              Example {index + 1}
                            </h3>
                            <p className="truncate text-sm font-medium">
                              {example.output}
                            </p>
                          </div>
                          <ChevronUp className="size-8 w-full" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <UpdateExampleDialog
                      example={example}
                      index={index}
                      examples={examples}
                      setExamples={setExamples}
                    />
                  </Dialog>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => {
                      handleDeleteExample(index);
                    }}
                  >
                    Delete
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => {
                      handleDuplicateExample(example, index);
                    }}
                  >
                    Duplicate
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const UpdateExampleDialog = ({
  example,
  index,
  examples,
  setExamples,
}: {
  example: ExampleBase;
  index: number;
  examples: ExampleBase[] | null;
  setExamples: (examples: ExampleBase[]) => void;
}) => {
  const [exampleInput, setExampleInput] = useState<string>(example.input);
  const [exampleOutput, setExampleOutput] = useState<string>(example.output);

  const handleSaveExample = () => {
    console.log("Updating example", index);
    const updatedExamples = [...examples];
    updatedExamples[index] = {
      input: exampleInput,
      output: exampleOutput,
    };
    setExamples(updatedExamples);
  };

  return (
    <DialogContent className="flex h-3/4 w-[800px] max-w-full flex-col">
      <DialogHeader>
        <DialogTitle>Update Example</DialogTitle>
        <DialogDescription>
          Add an example of the voice input (as text) and the desired AI
          output.{" "}
        </DialogDescription>
      </DialogHeader>
      <div className="flex h-full w-full items-start justify-between gap-3">
        <div className="flex h-full w-full flex-col gap-2">
          <h3 className="text-md pl-1 font-semibold">Input</h3>
          <Textarea
            className="h-full"
            placeholder="Enter your example input here..."
            value={exampleInput}
            onChange={(e) => setExampleInput(e.target.value)}
          />
        </div>
        <Separator orientation="vertical" className="my-2 h-full" />
        <div className="flex h-full w-full flex-col gap-2">
          <h3 className="text-md pl-1 font-semibold">Output</h3>
          <Textarea
            className="h-full"
            placeholder="Enter your desired output here..."
            value={exampleOutput}
            onChange={(e) => setExampleOutput(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter className="mt-4 flex justify-end gap-2">
        <DialogClose asChild>
          <Button variant="secondary">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="default" onClick={handleSaveExample}>
            Update Example
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};

const AddExampleDialog = ({
  exampleInput,
  setExampleInput,
  exampleOutput,
  setExampleOutput,
  examples,
  setExamples,
}: {
  example?: ExampleBase | null;
  index?: number;
  exampleInput: string;
  setExampleInput: (input: string) => void;
  exampleOutput: string;
  setExampleOutput: (output: string) => void;
  examples: ExampleBase[] | null;
  setExamples: (examples: ExampleBase[]) => void;
}) => {
  useEffect(() => {
    setExampleInput("");
    setExampleOutput("");
  }, []);

  const handleSaveExample = () => {
    console.log("Adding example", exampleInput, exampleOutput);
    setExamples([
      ...examples,
      {
        input: exampleInput,
        output: exampleOutput,
      },
    ]);
    setExampleInput("");
    setExampleOutput("");
  };

  return (
    <DialogContent className="flex h-3/4 w-[800px] max-w-full flex-col">
      <DialogHeader>
        <DialogTitle>Add Example</DialogTitle>
        <DialogDescription>
          Add an example of the voice input (as text) and the desired AI
          output.{" "}
        </DialogDescription>
      </DialogHeader>
      <div className="flex h-full w-full items-start justify-between gap-3">
        <div className="flex h-full w-full flex-col gap-2">
          <h3 className="text-md pl-1 font-semibold">Input</h3>
          <Textarea
            className="h-full"
            placeholder="Enter your example input here..."
            value={exampleInput}
            onChange={(e) => setExampleInput(e.target.value)}
          />
        </div>
        <Separator orientation="vertical" className="my-2 h-full" />
        <div className="flex h-full w-full flex-col gap-2">
          <h3 className="text-md pl-1 font-semibold">Output</h3>
          <Textarea
            className="h-full"
            placeholder="Enter your desired output here..."
            value={exampleOutput}
            onChange={(e) => setExampleOutput(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter className="mt-4 flex justify-end gap-2">
        <DialogClose asChild>
          <Button variant="secondary">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="default" onClick={handleSaveExample}>
            Add Example
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};
