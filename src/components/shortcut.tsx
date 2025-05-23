export const ShortcutDisplay = ({ shortcut }: { shortcut: string }) => {
  return (
    <div className="flex items-center gap-0 rounded-sm bg-zinc-200 px-[2px] py-1 text-xs font-semibold">
      {shortcut.split("+").map((key, index) => {
        switch (key) {
          case "Control":
            return (
              <div key={index} className="text-xs font-semibold">
                Ctrl
              </div>
            );
          case "Shift":
            return (
              <div key={index} className="text-xs font-semibold">
                Shift
              </div>
            );
          case "Alt":
            return (
              <div key={index} className="px-1 text-xs font-semibold">
                Alt
              </div>
            );
          default:
            return (
              <div key={index} className="px-1 text-xs font-semibold">
                {key}
              </div>
            );
        }
      })}
    </div>
  );
};
