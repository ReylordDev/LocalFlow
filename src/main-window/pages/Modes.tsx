import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import {
  ExampleBase,
  LanguageType,
  Mode,
  PromptBase,
  TextReplacement,
  TextReplacementBase,
  languageNameMap,
} from "../../lib/models";
import { Separator } from "../../components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Trash2,
  Wand,
} from "lucide-react";
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
      }
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
    <div className="h-full w-full flex flex-col py-24 px-32 gap-2 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1 max-w-[600px] min-h-10">
          <h1 className="font-bold text-xl">Create a Mode</h1>
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
            className="flex h-full justify-between items-center border border-zinc-300 bg-zinc-50 rounded-md p-4"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">{mode.name}</h2>
                {mode.active && (
                  <Badge
                    variant="default"
                    className="text-xs font-normal bg-zinc-500 hover:bg-zinc-500"
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
                      name: m.name,
                      active: false,
                      default: m.default,
                      voice_model_name: m.voice_model.name,
                      voice_language: m.voice_language,
                      text_replacements: m.text_replacements,
                      translate_to_english: m.translate_to_english,
                      use_language_model: m.use_language_model,
                      record_system_audio: m.record_system_audio,
                    });
                  });
                  window.database.modes.updateMode({
                    id: mode.id,
                    name: mode.name,
                    active: true,
                    default: mode.default,
                    voice_model_name: mode.voice_model.name,
                    voice_language: mode.voice_language,
                    text_replacements: mode.text_replacements,
                    translate_to_english: mode.translate_to_english,
                    use_language_model: mode.use_language_model,
                    record_system_audio: mode.record_system_audio,
                  });
                  console.log("Toggle Mode", mode.id, !mode.active);
                  setModes((prev) =>
                    prev.map((m) => {
                      if (m.id === mode.id) {
                        return { ...m, active: true };
                      } else {
                        return { ...m, active: false };
                      }
                    })
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
    mode ? mode.use_language_model : false
  );
  const [languageModelName, setLanguageModelName] = useState(
    mode ? mode.language_model?.name : ""
  );
  const [prompt, setPrompt] = useState<PromptBase>(mode ? mode.prompt : null); // TODO: Check the validity
  const [name, setName] = useState<string>(mode ? mode.name : "");
  const [voiceModelName, setVoiceModelName] = useState<string>(
    mode ? mode.voice_model.name : ""
  );
  const [voiceLanguage, setVoiceLanguage] = useState<string>(
    mode ? mode.voice_language : "auto"
  );
  const [translateToEnglish, setTranslateToEnglish] = useState<boolean>(
    mode ? mode.translate_to_english : false
  );
  const [textReplacements, setTextReplacements] = useState<
    TextReplacement[] | TextReplacementBase[]
  >(mode ? mode.text_replacements : []);
  const [textReplacementInput, setTextReplacementInput] =
    useState<TextReplacementBase>({
      replacement_text: "",
      original_text: "",
    });
  const [showPromptDialog, setShowPromptDialog] = useState<boolean>(false);

  const settingsAreValid = useMemo(() => {
    if (name.length === 0) return false;
    if (voiceModelName.length === 0) return false;
    // TODO: validate voice language input

    if (useAi) {
      if (!languageModelName) return false;
    }
    return true;
  }, [name, voiceModelName, voiceLanguage, useAi, languageModelName]);

  const unsavedChanges = useMemo(() => {
    if (mode) {
      // Check each condition separately and log the trigger
      if (mode.name !== name) {
        console.log(
          "Changes detected: name changed from",
          mode.name,
          "to",
          name
        );
        return true;
      }
      if (mode.voice_model.name !== voiceModelName) {
        console.log(
          "Changes detected: voice model changed from",
          mode.voice_model.name,
          "to",
          voiceModelName
        );
        return true;
      }
      if (mode.voice_language !== voiceLanguage) {
        console.log(
          "Changes detected: voice language changed from",
          mode.voice_language,
          "to",
          voiceLanguage
        );
        return true;
      }
      if (mode.translate_to_english !== translateToEnglish) {
        console.log(
          "Changes detected: translate to English changed from",
          mode.translate_to_english,
          "to",
          translateToEnglish
        );
        return true;
      }
      if (mode.text_replacements !== textReplacements) {
        console.log("Changes detected: text replacements changed");
        return true;
      }
      if (mode.use_language_model !== useAi) {
        console.log(
          "Changes detected: AI usage changed from",
          mode.use_language_model,
          "to",
          useAi
        );
        return true;
      }
      if (useAi) {
        if (mode.language_model?.name !== languageModelName) {
          console.log(
            "Changes detected: language model changed from",
            mode.language_model?.name,
            "to",
            languageModelName
          );
          return true;
        }
        if (mode.prompt?.system_prompt !== prompt?.system_prompt) {
          console.log("Changes detected: system prompt changed");
          return true;
        }
        if (mode.prompt?.include_clipboard !== prompt?.include_clipboard) {
          console.log("Changes detected: include clipboard changed");
          return true;
        }
        if (
          mode.prompt?.include_active_window !== prompt?.include_active_window
        ) {
          console.log("Changes detected: include active window changed");
          return true;
        }
        if (mode.prompt?.examples !== prompt?.examples) {
          console.log("Changes detected: examples changed");
          return true;
        }
      }
      return false;
    }
    return false;
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
      window.database.modes.updateMode({
        id: mode.id,
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

  console.log("ModeDetails", mode);

  return (
    <div className="h-full w-full flex flex-col ">
      <div className="flex justify-between items-center px-4 bg-gradient-to-l from-sky-300 to-sky-600 text-white border-b border-zinc-200">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-sky-700 hover:text-white"
            onClick={() => {
              setIndex(0);
            }}
          >
            <ChevronLeft className="size-8 " />
          </Button>
          <h1 className="font-bold text-2xl py-5">
            {mode?.name || "Create a new Mode"}
          </h1>
        </div>
        <Button
          variant="secondary"
          className={cn("mr-4", unsavedChanges && "border-rose-400 border-2")}
          disabled={!settingsAreValid}
          onClick={handleSaveMode}
        >
          {unsavedChanges && (
            <Badge variant="destructive" className="text-xs font-normal">
              Unsaved changes
            </Badge>
          )}
          {mode ? "Save Mode" : "Create Mode"}
        </Button>
      </div>
      <div className="flex flex-col gap-4 px-8 py-8 bg-zinc-50 overflow-y-auto h-full">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Language model</h2>
          <div className="flex flex-col gap-2 bg-white border border-zinc-200 rounded-md p-2">
            <div className={cn(menuItemClass)}>
              <div className="flex gap-3 items-center">
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
              <div className="flex flex-col gap-1 shrink w-3/4 sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] xl:max-w-full">
                <h3 className="text-md font-semibold">Prompt</h3>
                <p className="text-gray-500 truncate">
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
          <h2 className="text-lg font-semibold">Details</h2>
          <div className="flex flex-col gap-2 bg-white border border-zinc-200 rounded-md p-2">
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
          <div className="flex flex-col gap-2 bg-white border border-zinc-200 rounded-md p-2">
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Model</h3>
              <Combobox
                items={[
                  {
                    value: "large-v3-turbo",
                    label: "Whisper Large V3 Turbo",
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
          <h2 className="text-lg font-semibold">Text Replacements</h2>
          <div className="flex flex-col gap-2 bg-white border border-zinc-200 rounded-md p-2">
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
                <p className="text-sm font-medium text-gray-500 px-3 pl-5 py-2">
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
                            prev.filter((_, i) => i !== index)
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
    prompt ? prompt.system_prompt : ""
  );
  const [includeClipboard, setIncludeClipboard] = useState<boolean>(
    prompt ? prompt.include_clipboard : false
  );
  const [includeActiveWindow, setIncludeActiveWindow] = useState<boolean>(
    prompt ? prompt.include_active_window : false
  );
  const [examples, setExamples] = useState<ExampleBase[]>(
    prompt ? prompt.examples : []
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

  console.log("PromptDetails", prompt);
  console.log("System Prompt", systemPrompt);

  return (
    <div className="inset-y-0 left-80 right-0 flex flex-col fixed z-50">
      <div className="flex justify-between items-center px-4 bg-gradient-to-l from-sky-300 to-sky-600 text-white border-b border-zinc-200">
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
            <ChevronLeft className="size-8 " />
          </Button>
          <h1 className="font-bold text-2xl py-5">
            {prompt ? "Prompt" : "Create a new Prompt"}
          </h1>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-8 py-8 bg-zinc-50 overflow-y-auto h-full">
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
          <div className="flex flex-col gap-2 bg-white border border-zinc-200 rounded-md p-2">
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
          <div className="bg-zinc-100 gap-4 rounded-md flex flex-col justify-center items-center p-4">
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
              <Dialog key={index}>
                <DialogTrigger>
                  <div className="flex flex-col gap-2 bg-white border border-zinc-200 rounded-md p-2 hover:bg-zinc-100">
                    <div className={cn(menuItemClass)}>
                      <div className="flex gap-2 items-center">
                        <h3 className="text-md font-semibold">
                          Example {index + 1}
                        </h3>
                        <p className="text-sm font-medium">{example.output}</p>
                      </div>
                      <ChevronUp className="size-8 " />
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
    <DialogContent className=" flex flex-col max-w-full w-[800px] h-3/4">
      <DialogHeader>
        <DialogTitle>Update Example</DialogTitle>
        <DialogDescription>
          Add an example of the voice input (as text) and the desired AI output.{" "}
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-between items-start gap-3 h-full w-full">
        <div className="flex flex-col gap-2 w-full h-full">
          <h3 className="text-md font-semibold pl-1">Input</h3>
          <Textarea
            className="h-full"
            placeholder="Enter your example input here..."
            value={exampleInput}
            onChange={(e) => setExampleInput(e.target.value)}
          />
        </div>
        <Separator orientation="vertical" className="h-full my-2" />
        <div className="flex flex-col gap-2 w-full h-full">
          <h3 className="text-md font-semibold pl-1">Output</h3>
          <Textarea
            className="h-full"
            placeholder="Enter your desired output here..."
            value={exampleOutput}
            onChange={(e) => setExampleOutput(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter className="flex justify-end gap-2 mt-4">
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
    <DialogContent className=" flex flex-col max-w-full w-[800px] h-3/4">
      <DialogHeader>
        <DialogTitle>Add Example</DialogTitle>
        <DialogDescription>
          Add an example of the voice input (as text) and the desired AI output.{" "}
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-between items-start gap-3 h-full w-full">
        <div className="flex flex-col gap-2 w-full h-full">
          <h3 className="text-md font-semibold pl-1">Input</h3>
          <Textarea
            className="h-full"
            placeholder="Enter your example input here..."
            value={exampleInput}
            onChange={(e) => setExampleInput(e.target.value)}
          />
        </div>
        <Separator orientation="vertical" className="h-full my-2" />
        <div className="flex flex-col gap-2 w-full h-full">
          <h3 className="text-md font-semibold pl-1">Output</h3>
          <Textarea
            className="h-full"
            placeholder="Enter your desired output here..."
            value={exampleOutput}
            onChange={(e) => setExampleOutput(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter className="flex justify-end gap-2 mt-4">
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
