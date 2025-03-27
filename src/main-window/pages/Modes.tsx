import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import {
  LanguageType,
  Mode,
  TextReplacement,
  TextReplacementBase,
  languageNameMap,
} from "../../lib/models";
import { Separator } from "../../components/ui/separator";
import { ChevronLeft, ChevronRight, Trash2, Wand } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { Combobox } from "../../components/combobox";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";

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

  return (
    <div className="h-full w-full flex flex-col py-24 px-32 gap-2">
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
          <Button
            variant="ghost"
            key={index}
            onClick={() => {
              setIndex(1);
              setSelectedMode(mode);
            }}
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
            <ChevronRight />
          </Button>
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
    mode ? (mode.language_model ? mode.language_model.name : null) : null
  );
  const [prompt, setPrompt] = useState(mode ? mode.prompt : null); // TODO: Check the validity
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
  const [textReplacement, setTextReplacement] = useState<TextReplacementBase>({
    replacement_text: "",
    original_text: "",
  });

  const settingsAreValid = useMemo(() => {
    return (
      name.length > 0 && voiceModelName.length > 0 && voiceLanguage.length > 0
    );
  }, [name, voiceModelName, voiceLanguage]);

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
          className="mr-4"
          disabled={!settingsAreValid}
          onClick={handleSaveMode}
        >
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
              <div className="flex flex-col gap-1">
                <h3 className="text-md font-semibold">Prompt</h3>
                <p className="text-gray-500">
                  {prompt
                    ? prompt.system_prompt.slice(0, 100).concat("...")
                    : "No prompt selected."}
                </p>
              </div>
              <Button
                onClick={() => {
                  console.log("Change prompt...");
                }}
                disabled={!useAi}
              >
                Change prompt...
              </Button>
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
                value={textReplacement.original_text}
                onChange={(e) =>
                  setTextReplacement({
                    ...textReplacement,
                    original_text: e.target.value,
                  })
                }
              ></Input>
              <Separator orientation="vertical" className="h-8" />
              <Input
                className="w-full"
                placeholder="Replacement"
                value={textReplacement.replacement_text}
                onChange={(e) =>
                  setTextReplacement({
                    ...textReplacement,
                    replacement_text: e.target.value,
                  })
                }
              ></Input>
              <Separator orientation="vertical" className="h-8" />
              <Button
                variant="default"
                onClick={() => {
                  console.log("Add text replacement", textReplacement);
                  setTextReplacements([...textReplacements, textReplacement]);
                  setTextReplacement({
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
