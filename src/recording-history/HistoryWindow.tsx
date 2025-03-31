import { Search } from "lucide-react";
import { Result } from "../lib/models";
import { useEffect, useState } from "react";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";

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
    <div className="w-80 shrink-0 h-screen flex flex-col">
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
  return <div className="w-full h-screen bg-red-300">Hello World</div>;
}
