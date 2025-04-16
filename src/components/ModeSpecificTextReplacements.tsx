import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useModeStore } from "../stores/mode-store";
import { TextReplacementBase } from "../lib/models/database";

const menuItemClass = "justify-between items-center flex px-4 min-h-[50px]";

export function ModeSpecificTextReplacements() {
  const { textReplacements, setTextReplacements } = useModeStore();
  const [textReplacementInput, setTextReplacementInput] =
    useState<TextReplacementBase>({
      original_text: "",
      replacement_text: "",
    });

  const handleAddTextReplacement = () => {
    if (
      !textReplacementInput.original_text ||
      !textReplacementInput.replacement_text
    ) {
      return;
    }

    setTextReplacements([...textReplacements, textReplacementInput]);
    setTextReplacementInput({ original_text: "", replacement_text: "" });
  };

  const handleDeleteTextReplacement = (index: number) => {
    const newReplacements = [...textReplacements];
    newReplacements.splice(index, 1);
    setTextReplacements(newReplacements);
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Text Replacements</h2>
      <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
        <div className={cn(menuItemClass, "gap-4")}>
          <Input
            className="w-full"
            placeholder="Original text"
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
            placeholder="Replacement text"
            value={textReplacementInput.replacement_text}
            onChange={(e) =>
              setTextReplacementInput({
                ...textReplacementInput,
                replacement_text: e.target.value,
              })
            }
          />
          <Separator orientation="vertical" className="h-8" />
          <Button
            variant="default"
            onClick={handleAddTextReplacement}
            disabled={
              !textReplacementInput.original_text ||
              !textReplacementInput.replacement_text
            }
          >
            Add
          </Button>
        </div>
        <Separator orientation="horizontal" />
        <div>
          {textReplacements.length === 0 ? (
            <p className="px-3 py-2 pl-5 text-sm font-medium text-gray-500">
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
                    onClick={() => handleDeleteTextReplacement(index)}
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
  );
}
