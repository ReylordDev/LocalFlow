import {
  ArrowUpRight,
  Brain,
  History,
  MoveUpRight,
  Settings,
  UserRound,
  Volume2,
} from "lucide-react";
import { Page, pages } from "../lib/models";

import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";

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
    } else {
      // Handle internal navigation
      setPage(identifier as Page);
    }
  };
  return (
    <div className="flex flex-col min-w-80 border-r-2 border-gray-200 ">
      <h1 className="text-3xl font-bold justify-center flex p-8 select-none">
        LocalFlow
      </h1>
      <div className="px-4 gap-2 flex flex-col">
        {pages.map((identifier, index) => (
          <Button
            variant="ghost"
            className={cn(
              "flex justify-start text-lg items-center gap-4 rounded-md p-2 hover:bg-gray-200",
              currentPage === identifier &&
                "bg-sky-600 text-white hover:bg-sky-600 hover:text-white"
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
