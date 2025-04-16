import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import {
  LanguageModel,
  Mode,
  VoiceModel,
  languageNameMap,
} from "../../lib/models/database";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { tryCatch } from "../../lib/utils";
import { ModeDetails } from "../../components/ModeDetails";
import { useModeStore } from "../../stores/mode-store";

export default function Modes() {
  const [modes, setModes] = useState<Mode[]>([]);
  const [index, setIndex] = useState<number>(0);
  const { setMode } = useModeStore();

  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]);
  const [languageModels, setLanguageModels] = useState<LanguageModel[]>([]);

  useEffect(() => {
    async function fetchVoiceModels() {
      const { data, error } = await tryCatch(
        window.database.voiceModels.fetchAllVoiceModels(),
      );
      if (error) {
        console.error("Error fetching voice models:", error);
        return;
      }
      console.log("Fetched Voice Models", data);
      setVoiceModels(data);
    }

    fetchVoiceModels();
  }, []);

  useEffect(() => {
    async function fetchLanguageModels() {
      const { data, error } = await tryCatch(
        window.database.languageModels.fetchAllLanguageModels(),
      );
      if (error) {
        console.error("Error fetching language models:", error);
        return;
      }
      console.log("Fetched Language Models", data);
      setLanguageModels(data);
    }

    fetchLanguageModels();
  }, []);

  useEffect(() => {
    async function fetchModes() {
      const { data, error } = await tryCatch(
        window.database.modes.fetchAllModes(),
      );
      if (error) {
        console.error("Error fetching modes:", error);
        return;
      }
      console.log("Fetched Modes", data);
      setModes(data);
    }

    fetchModes();
  }, [index]); // refetch modes when index changes

  if (index === 1) {
    return (
      <ModeDetails
        setIndex={setIndex}
        voiceModels={voiceModels}
        languageModels={languageModels}
      />
    );
  }

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
            setMode(null);
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
                  setMode(mode);
                }}
              >
                Edit
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  window.database.modes.activateMode(mode.id);
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
