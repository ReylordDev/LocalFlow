import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ChevronLeft, ChevronUp, Wand } from "lucide-react";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";
import { ExampleBase } from "../lib/models/database";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { useModeStore } from "../stores/mode-store";

const menuItemClass = "justify-between items-center flex px-4 min-h-[50px]";

interface PromptDetailsProps {
  hidePromptDialog: () => void;
}

interface ExampleDialogProps {
  example?: ExampleBase;
  index?: number;
  isUpdate?: boolean;
}

export function PromptDetails({ hidePromptDialog }: PromptDetailsProps) {
  const { prompt, setPrompt } = useModeStore();

  const [promptState, setPromptState] = useState({
    systemPrompt: prompt?.system_prompt ?? "",
    includeClipboard: prompt?.include_clipboard ?? false,
    includeActiveWindow: prompt?.include_active_window ?? false,
    examples: prompt?.examples ?? [],
  });

  const handleSavePrompt = () => {
    setPrompt({
      system_prompt: promptState.systemPrompt,
      include_clipboard: promptState.includeClipboard,
      include_active_window: promptState.includeActiveWindow,
      examples: promptState.examples,
    });
    hidePromptDialog();
  };

  const handleDeleteExample = (index: number) => {
    setPromptState((prev) => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  };

  const handleDuplicateExample = (example: ExampleBase, index: number) => {
    setPromptState((prev) => {
      const newExamples = [...prev.examples];
      newExamples.splice(index, 0, example);
      return { ...prev, examples: newExamples };
    });
  };

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
          <h1 className="py-5 text-2xl font-bold">Prompt</h1>
        </div>
      </div>
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-zinc-50 px-8 py-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Prompt</h2>
          <Textarea
            className="h-40"
            placeholder="Enter your prompt here..."
            value={promptState.systemPrompt}
            onChange={(e) =>
              setPromptState((prev) => ({
                ...prev,
                systemPrompt: e.target.value,
              }))
            }
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
                checked={promptState.includeClipboard}
                onCheckedChange={(checked) =>
                  setPromptState((prev) => ({
                    ...prev,
                    includeClipboard: checked,
                  }))
                }
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
                checked={promptState.includeActiveWindow}
                onCheckedChange={(checked) =>
                  setPromptState((prev) => ({
                    ...prev,
                    includeActiveWindow: checked,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {promptState.examples.length === 0 ? (
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
                <Button variant="default" className="mt-4">
                  + Add Example
                </Button>
              </DialogTrigger>
              <ExampleDialog
                examples={promptState.examples}
                setExamples={(examples) =>
                  setPromptState((prev) => ({ ...prev, examples }))
                }
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
                <ExampleDialog
                  examples={promptState.examples}
                  setExamples={(examples) =>
                    setPromptState((prev) => ({ ...prev, examples }))
                  }
                />
              </Dialog>
            </div>
            {promptState.examples.map((example, index) => (
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
                          <ChevronUp className="size-8" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <ExampleDialog
                      example={example}
                      index={index}
                      examples={promptState.examples}
                      setExamples={(examples) =>
                        setPromptState((prev) => ({ ...prev, examples }))
                      }
                      isUpdate
                    />
                  </Dialog>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleDeleteExample(index)}>
                    Delete
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => handleDuplicateExample(example, index)}
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
}

function ExampleDialog({
  example,
  index,
  isUpdate = false,
  examples,
  setExamples,
}: ExampleDialogProps & {
  examples: ExampleBase[];
  setExamples: (examples: ExampleBase[]) => void;
}) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    if (example) {
      setInput(example.input);
      setOutput(example.output);
    }
  }, [example]);

  const handleSaveExample = () => {
    if (isUpdate && typeof index !== "undefined") {
      const updatedExamples = [...examples];
      updatedExamples[index] = {
        input,
        output,
      };
      setExamples(updatedExamples);
    } else {
      setExamples([
        ...examples,
        {
          input,
          output,
        },
      ]);
    }
  };

  return (
    <DialogContent className="flex h-3/4 w-[800px] max-w-full flex-col">
      <DialogHeader>
        <DialogTitle>{isUpdate ? "Update Example" : "Add Example"}</DialogTitle>
        <DialogDescription>
          Add an example of the voice input (as text) and the desired AI output.
        </DialogDescription>
      </DialogHeader>
      <div className="flex h-full w-full items-start justify-between gap-3">
        <div className="flex h-full w-full flex-col gap-2">
          <h3 className="text-md pl-1 font-semibold">Input</h3>
          <Textarea
            className="h-full"
            placeholder="Enter your example input here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <Separator orientation="vertical" className="my-2 h-full" />
        <div className="flex h-full w-full flex-col gap-2">
          <h3 className="text-md pl-1 font-semibold">Output</h3>
          <Textarea
            className="h-full"
            placeholder="Enter your desired output here..."
            value={output}
            onChange={(e) => setOutput(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter className="mt-4 flex justify-end gap-2">
        <DialogClose asChild>
          <Button variant="secondary">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="default" onClick={handleSaveExample}>
            {isUpdate ? "Update Example" : "Add Example"}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
