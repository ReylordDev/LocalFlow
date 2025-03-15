import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Mode, languageNameMap } from "../../lib/models";
import { Separator } from "../../components/ui/separator";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";

export default function Modes() {
  const [modes, setModes] = useState<Mode[]>([]);
  const [index, setIndex] = useState<number>(0);
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
        <div className="flex flex-col gap-1 max-w-[600px]">
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
    <div className="h-full w-full flex flex-col bg-zinc-700 text-zinc-50">
      <div className="flex items-center gap-4 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIndex(0);
          }}
        >
          <ChevronLeft className="size-8" />
        </Button>
        <h1 className="font-bold text-2xl">
          {mode?.name || "Create a new Mode"}
        </h1>
      </div>
      <div className="flex flex-col gap-4 px-8 py-8 bg-zinc-800 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Language model</h2>
          <div className="flex flex-col gap-2 bg-zinc-700 border border-zinc-600 rounded-md p-2">
            <div className="justify-between items-center flex px-4">
              <div className="flex gap-3 items-center">
                <Sparkles className="text-zinc-400" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-md font-semibold">Enable AI</h3>
                  <p className="text-sm font-medium text-zinc-300">
                    Turn your dictated text into anything
                  </p>
                </div>
              </div>
              <Switch />
            </div>
            <Separator orientation="horizontal" />
            <div></div>
            <Separator orientation="horizontal" />
            <div></div>
          </div>
        </div>
      </div>
    </div>
  );
};
