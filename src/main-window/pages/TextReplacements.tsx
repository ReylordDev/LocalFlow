import { useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import {
  TextReplacement,
  TextReplacementBase,
} from "../../lib/models/database";
import { Trash2 } from "lucide-react";
import { cn, tryCatch } from "../../lib/utils";

const menuItemClass = "justify-between items-center flex px-4 min-h-[50px]";

export default function TextReplacements() {
  const [textReplacements, setTextReplacements] = useState<TextReplacement[]>(
    [],
  );
  const [textReplacementInput, setTextReplacementInput] =
    useState<TextReplacementBase>({
      original_text: "",
      replacement_text: "",
    });

  useEffect(() => {
    async function fetchTextReplacements() {
      const { data, error } = await tryCatch(
        window.database.textReplacements.fetchAllTextReplacements(),
      );
      if (error) {
        console.error("Error fetching text replacements:", error);
        return;
      }
      console.log("Fetched Text Replacements", data);
      setTextReplacements(data);
    }

    fetchTextReplacements();
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-l from-sky-300 to-sky-600 px-4 text-white">
        <div className="flex items-center gap-4">
          <h1 className="py-5 text-2xl font-bold">Text Replacements</h1>
        </div>
      </div>
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-zinc-50 px-8 py-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Global Replacements</h2>
          <p className="text-sm text-gray-500">
            Create text replacements that will be applied to all modes.
          </p>
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
              />
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
              />
              <Button
                variant="default"
                onClick={() => {
                  window.database.textReplacements.createTextReplacement(
                    textReplacementInput,
                  );
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
            {textReplacements.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500">
                No text replacements added.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {textReplacements.map((replacement) => (
                  <div
                    key={replacement.id}
                    className={cn(menuItemClass, "gap-4")}
                  >
                    <h3 className="text-md flex-1 px-3">
                      {replacement.original_text}
                    </h3>
                    <Separator orientation="vertical" className="h-8" />
                    <h3 className="text-md flex-1 px-3">
                      {replacement.replacement_text}
                    </h3>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        window.database.textReplacements.deleteTextReplacement(
                          replacement.id,
                        );
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
