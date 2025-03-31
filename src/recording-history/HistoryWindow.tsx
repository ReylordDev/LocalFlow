import { Copy, FolderClosed, PanelRightOpen, Search } from "lucide-react";
import { Result } from "../lib/models";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

const HistoryWindow = () => {
  const [history, setHistory] = useState<Result[]>([]);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  useEffect(() => {
    window.recordingHistory.requestAll();

    const unsubscribe = window.recordingHistory.onReceiveResults((results) => {
      setHistory(results);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  function selectResult(result: Result) {
    setSelectedResult(result);
  }

  return (
    <div className="h-screen flex select-none">
      <Sidebar history={history} selectResult={selectResult} />
      <ResultDetails result={selectedResult} />
    </div>
  );
};

export default HistoryWindow;

function Sidebar({
  history,
  selectResult,
}: {
  history: Result[];
  selectResult: (result: Result) => void;
}) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredHistory, setFilteredHistory] = useState<Result[]>(history);

  useEffect(() => {
    setFilteredHistory(history);
  }, [history]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    if (value === "") {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(
        history.filter((result) =>
          result.mode.use_language_model
            ? result.ai_result.toLowerCase().includes(value) ||
              result.transcription.toLowerCase().includes(value)
            : result.transcription.toLowerCase().includes(value)
        )
      );
    }
  };

  console.log("History:", history);
  console.log("Filtered history:", filteredHistory);
  console.log("Search term:", searchTerm);

  return (
    <div className="w-80 shrink-0 h-screen flex flex-col border-r">
      <div className="flex items-center border rounded-md p-2 mt-4 mx-8 ml-6 shadow-sm">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          className={cn(
            "h-4 rounded-md border-0 py-3 text-sm outline-none placeholder:text-zinc-500 w-full"
          )}
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      <div className="flex flex-col gap-2 p-2 overflow-y-auto h-screen">
        {filteredHistory.map((result) => (
          <div
            key={result.id}
            onClick={() => selectResult(result)}
            className="rounded-md px-4 hover:bg-sky-600 hover:text-white group"
          >
            <h3 className="text-md truncate">
              {result.mode.use_language_model
                ? result.ai_result
                : result.transcription}
            </h3>
            <div className="justify-between items-center flex">
              <p className="text-sm text-zinc-500 group-hover:text-zinc-100">
                {new Date(result.created_at * 1000).toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500 group-hover:text-zinc-100">
                {result.duration.toFixed(0)}s
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultDetails({ result }: { result: Result }) {
  const [displayState, setDisplayState] = useState<
    "transcription" | "ai_result"
  >("transcription");

  if (!result) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-500">Select a recording to view details</p>
      </div>
    );
  }

  console.log("ResultDetails:", result);

  return (
    <Tabs
      defaultValue="transcription"
      className="w-full max-w-[1120px] h-screen flex flex-col items-center"
    >
      <div className="flex w-full p-4 justify-between items-center">
        <p className="select-text">
          {new Date(result.created_at * 1000).toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              window.clipboard.copy(
                displayState === "transcription"
                  ? result.transcription
                  : result.mode.use_language_model
                    ? result.ai_result
                    : result.transcription
              );
            }}
          >
            <Copy />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              console.log("Opening file:", result.location);
              window.file.open(result.location);
            }}
          >
            <FolderClosed />
          </Button>
          <TabsList>
            <TabsTrigger
              onClick={() => setDisplayState("transcription")}
              value="transcription"
            >
              Transcription
            </TabsTrigger>
            <TabsTrigger
              disabled={!result.mode.use_language_model}
              onClick={() => setDisplayState("ai_result")}
              value="ai_result"
            >
              AI Result
            </TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="icon">
            <PanelRightOpen />
          </Button>
        </div>
      </div>
      <TabsContent value="transcription" className="w-full">
        <p className="whitespace-pre-line w-full p-4 select-text">
          {result.transcription}
        </p>
      </TabsContent>
      <TabsContent value="ai_result" className="w-full">
        <p className="whitespace-pre-line w-full p-4 select-text">
          {result.mode.use_language_model
            ? result.ai_result
            : result.transcription}
        </p>
      </TabsContent>
    </Tabs>
  );
}
