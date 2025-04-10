import {
  ArrowUpRight,
  Brain,
  History,
  Settings,
  TextCursorInput,
  UserRound,
  Volume2,
} from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Page, pages } from "../lib/models/ui";

type SidebarItem = {
  icon: React.ReactNode;
  external: boolean;
};

const sidebarRecord: Record<Page, SidebarItem> = {
  Configuration: {
    icon: <Settings />,
    external: false,
  },
  Credits: {
    icon: <UserRound />,
    external: false,
  },
  Modes: {
    icon: <Brain />,
    external: false,
  },
  Audio: {
    icon: <Volume2 />,
    external: false,
  },
  "Recording History": {
    icon: <History />,
    external: true,
  },
  "Text Replacements": {
    icon: <TextCursorInput />,
    external: false,
  },
};

export function AppSidebar({
  currentPage,
  setPage,
}: {
  currentPage: Page;
  setPage: (page: Page) => void;
}) {
  const handleSidebarClick = (identifier: string, item: SidebarItem) => {
    if (item.external) {
      if (identifier === "Recording History") {
        // TODO: Open the recording history
        window.recordingHistory.openWindow();
      }
      setPage(identifier as Page);
    } else {
      // Handle internal navigation
      setPage(identifier as Page);
    }
  };
  return (
    <div className="flex min-w-80 flex-col border-r-2 border-gray-200">
      <h1 className="flex select-none justify-center p-8 text-3xl font-bold">
        LocalFlow
      </h1>
      <div className="flex flex-col gap-2 px-4">
        {pages.map((identifier, index) => (
          <Button
            variant="ghost"
            className={cn(
              "flex items-center justify-start gap-4 rounded-md p-2 text-lg hover:bg-gray-200",
              currentPage === identifier &&
                "bg-sky-600 text-white hover:bg-sky-600 hover:text-white",
            )}
            onClick={() =>
              handleSidebarClick(identifier, sidebarRecord[identifier])
            }
            key={index}
          >
            {sidebarRecord[identifier].icon}
            <p>{identifier}</p>
            {sidebarRecord[identifier].external && (
              <ArrowUpRight className="ml-auto" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
