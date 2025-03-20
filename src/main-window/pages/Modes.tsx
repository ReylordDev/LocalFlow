import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Mode, languageNameMap } from "../../lib/models";
import { Separator } from "../../components/ui/separator";
import { ChevronLeft, ChevronRight, Wand } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { Combobox } from "../../components/combobox";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";

const menuItemClass = "justify-between items-center flex px-4 min-h-[50px]";

export default function Modes() {
  const [modes, setModes] = useState<Mode[]>([]);
  const [index, setIndex] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);

  useEffect(() => {
    window.database.modes.requestAll();
  }, []);

  useEffect(() => {
    const unsubscribe = window.database.modes.onReceiveModes(
      (modes: Mode[]) => {
        console.log("Received Modes", modes);
        setModes(modes);
      }
    );
    return () => unsubscribe();
  }, []);

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
          <div
            key={index}
            className="flex justify-between items-center border border-zinc-300 bg-zinc-50 rounded-md p-4"
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
                {mode.voice_model_id} ({languageNameMap[mode.voice_language]})
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log("Edit Mode", mode);
              }}
            >
              <ChevronRight />
            </Button>
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
  return (
    <div className="h-full w-full flex flex-col ">
      <div className="flex items-center gap-4 px-4 bg-gradient-to-l from-sky-300 to-sky-600 text-white border-b border-zinc-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIndex(0);
          }}
        >
          <ChevronLeft className="size-8" />
        </Button>
        <h1 className="font-bold text-2xl py-5">
          {mode?.name || "Create a new Mode"}
        </h1>
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
              <Switch />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Model</h3>
              <Combobox
                // TODO: Disable this combobox if AI is disabled
                items={[
                  {
                    value: "gemma3-4b",
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
                intialMessage="Select a model..."
                noMatchesMessage="No models found"
                searchPlaceholder="Search for a model"
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <div className="flex flex-col gap-1">
                <h3 className="text-md font-semibold">Prompt</h3>
                <p className="text-gray-500">This is a prompt placeholder.</p>
              </div>
              <Button
                onClick={() => {
                  console.log("Change prompt...");
                }}
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
              <Input className="max-w-[200px]"></Input>
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
                    value: "whisper-v3-turbo",
                    label: "Whisper V3 Turbo",
                  },
                ]}
                intialMessage="Select a model..."
                noMatchesMessage="No models found"
                searchPlaceholder="Search for a model"
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Language</h3>
              <Combobox
                items={[
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
                intialMessage="Select a language..."
                noMatchesMessage="No languages found"
                searchPlaceholder="Search for a language"
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Translate to English</h3>
              <Switch
              // TODO: disable this switch if the language is English
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Text Replacements</h2>
          <div className="flex flex-col gap-2 bg-white border border-zinc-200 rounded-md p-2">
            <div className={cn(menuItemClass, "gap-4")}>
              <Input className="w-full" placeholder="Original"></Input>
              <Separator orientation="vertical" className="h-8" />
              <Input className="w-full" placeholder="Replacement"></Input>
              <Separator orientation="vertical" className="h-8" />
              <Button variant="default">Add</Button>
            </div>
            <Separator orientation="horizontal" />
            {/* List the text replacements */}
          </div>
        </div>
      </div>
    </div>
  );
};
