import { Copy, FolderClosed, PanelRightOpen, Search } from "lucide-react";
import { ExampleBase, languageNameMap, Result } from "../lib/models/database";
import { useEffect, useState } from "react";
import { cn, tryCatch } from "../lib/utils";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../components/ui/context-menu";
import { UUID } from "crypto";
import { useLocale } from "../hooks/use-locale";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar as SidebarShadcn,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "../components/ui/sidebar";
import { Separator } from "../components/ui/separator";
import { useHistoryStore } from "../stores/history-store";

const HistoryWindow = () => {
  const { setResults, selectedResult } = useHistoryStore();

  useEffect(() => {
    async function fetchHistory() {
      const { data, error } = await tryCatch(
        window.database.results.fetchAllResults(),
      );
      if (error) {
        console.error("Error fetching history:", error);
        return;
      }
      setResults(data);
    }

    fetchHistory();
  }, [setResults]);

  return (
    <div className="flex h-screen select-none">
      <Sidebar />
      <ResultDetails result={selectedResult} />
    </div>
  );
};

export default HistoryWindow;

function Sidebar() {
  const {
    filteredResults,
    selectedResult,
    searchTerm,
    setSelectedResult,
    setSearchTerm,
    deleteResult,
  } = useHistoryStore();
  const locale = useLocale();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = (resultId: UUID) => {
    window.database.results.deleteResult(resultId);
    deleteResult(resultId);
  };

  const handleAddExample = (result: Result) => {
    console.log("Adding result as example:", result);
    if (!result.mode.use_language_model || !result.mode.prompt) {
      console.log("Result Mode does not use a prompt.");
      return;
    }
    const example: ExampleBase = {
      input: result.transcription,
      output: result.ai_result || "",
    };
    window.database.examples.addExample(result.mode.prompt.id, example);
    // perhaps show a toast or notification here
  };

  return (
    <div className="flex h-screen w-80 shrink-0 flex-col border-r">
      <div className="mx-8 ml-6 mt-4 flex items-center rounded-md border p-2 shadow-sm">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          className={cn(
            "h-4 w-full rounded-md border-0 py-3 text-sm outline-none placeholder:text-zinc-500",
          )}
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      <div className="flex h-screen flex-col gap-2 overflow-y-auto p-2">
        {filteredResults.map((result) => (
          <ContextMenu key={result.id}>
            <ContextMenuTrigger>
              <div
                onClick={() => setSelectedResult(result)}
                className="group rounded-md px-4 hover:bg-sky-600 hover:text-white"
              >
                <h3 className="text-md truncate">
                  {result.mode.use_language_model
                    ? result.ai_result
                    : result.transcription}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-500 group-hover:text-zinc-100">
                    {new Date(result.created_at * 1000).toLocaleString(locale)}
                  </p>
                  <p className="text-sm text-zinc-500 group-hover:text-zinc-100">
                    {result.duration.toFixed(0)}s
                  </p>
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="p-0">
              <ContextMenuItem
                onClick={() => {
                  handleDelete(result.id);
                }}
              >
                Delete
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => {
                  handleAddExample(result);
                }}
              >
                Add as example
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </div>
  );
}

function ResultDetails({ result }: { result: Result | null }) {
  const [displayState, setDisplayState] = useState<
    "transcription" | "ai_result"
  >("transcription");
  const locale = useLocale();

  if (!result) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-gray-500">Select a recording to view details</p>
      </div>
    );
  }

  console.log("ResultDetails:", result);

  return (
    <SidebarProvider defaultOpen={false}>
      <Tabs
        defaultValue="transcription"
        className="flex h-screen w-full max-w-[1120px] flex-col items-center"
      >
        <div className="flex w-full items-center justify-between p-4">
          <p className="select-text">
            {new Date(result.created_at * 1000).toLocaleString(locale)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                window.clipboard.copy(
                  displayState === "transcription"
                    ? result.transcription
                    : result.mode.use_language_model && result.ai_result
                      ? result.ai_result
                      : result.transcription,
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
            <SidebarTrigger>
              {/* <Button variant="ghost" size="icon"> */}
              <PanelRightOpen />
              {/* </Button> */}
            </SidebarTrigger>
          </div>
        </div>
        <TabsContent value="transcription" className="w-full">
          <p className="w-full select-text whitespace-pre-line p-4">
            {result.transcription}
          </p>
        </TabsContent>
        <TabsContent value="ai_result" className="w-full">
          <p className="w-full select-text whitespace-pre-line p-4">
            {result.mode.use_language_model
              ? result.ai_result
              : result.transcription}
          </p>
        </TabsContent>
      </Tabs>
      <MetadataSidebar result={result} />
    </SidebarProvider>
  );
}

function MetadataSidebar({ result }: { result: Result }) {
  const locale = useLocale();
  return (
    <SidebarShadcn side="right">
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel>Recording</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex w-full flex-col gap-2 rounded-md border bg-zinc-100 p-4">
              <SidebarMenuItem className="flex items-center justify-between">
                <p>Duration</p>
                <p>{result.duration.toFixed(0)}s</p>
              </SidebarMenuItem>
              <Separator orientation="horizontal" />
              <SidebarMenuItem className="flex items-center justify-between">
                <p>Processing Time</p>
                <p>{result.processing_time.toFixed(0)}s</p>
              </SidebarMenuItem>
              <Separator orientation="horizontal" />
              <SidebarMenuItem className="flex items-center justify-between">
                <p>Created At</p>
                <p>
                  {new Date(result.created_at * 1000).toLocaleString(locale)}
                </p>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex w-full flex-col gap-2 rounded-md border bg-zinc-100 p-4">
              <SidebarMenuItem className="flex items-center justify-between">
                <p>Mode</p>
                <p>{result.mode.name}</p>
              </SidebarMenuItem>
              <Separator orientation="horizontal" />
              <SidebarMenuItem className="flex items-center justify-between">
                <p>Model</p>
                <p>{result.mode.voice_model.name}</p>
              </SidebarMenuItem>
              <Separator orientation="horizontal" />
              {result.mode.use_language_model && result.mode.language_model && (
                <SidebarMenuItem className="flex items-center justify-between">
                  <p>Language Model</p>
                  <p>{result.mode.language_model.name}</p>
                </SidebarMenuItem>
              )}
              <Separator orientation="horizontal" />
              <SidebarMenuItem className="flex items-center justify-between">
                <p>Language</p>
                <p>{languageNameMap[result.mode.voice_language]}</p>
              </SidebarMenuItem>
              <Separator orientation="horizontal" />
              <SidebarMenuItem className="flex items-center justify-between">
                <p>English Translation Enabled</p>
                <p>{result.mode.translate_to_english ? "Yes" : "No"}</p>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {result.mode.use_language_model && result.mode.prompt && (
          <SidebarGroup>
            <SidebarGroupLabel>Prompt</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="flex w-full flex-col gap-2 rounded-md border bg-zinc-100 p-4">
                <SidebarMenuItem className="flex items-center justify-between">
                  <p className="select-text">
                    {result.mode.prompt.system_prompt}
                  </p>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </SidebarShadcn>
  );
}
