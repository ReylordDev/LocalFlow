import { Brain, Settings, UserRound } from "lucide-react";
import { Page, pages } from "../lib/models";

import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";

const pageRecord: Record<
  Page,
  {
    icon: React.ReactNode;
  }
> = {
  Settings: {
    icon: <Settings />,
  },
  Credits: {
    icon: <UserRound />,
  },
  Modes: {
    icon: <Brain />,
  },
};

export function AppSidebar({
  currentPage,
  setPage,
}: {
  currentPage: Page;
  setPage: (page: Page) => void;
}) {
  return (
    <div className="flex flex-col w-96 border-r-2 border-gray-200 ">
      <h1 className="text-3xl font-bold justify-center flex p-8 select-none">
        LocalFlow
      </h1>
      <div className="px-4 gap-2 flex flex-col">
        {pages.map((item, index) => (
          <Button
            variant="ghost"
            className={cn(
              "flex justify-start text-lg items-center gap-4 rounded-md p-2 hover:bg-gray-200",
              currentPage === item &&
                "bg-sky-600 text-white hover:bg-sky-600 hover:text-white"
            )}
            onClick={() => setPage(item as Page)}
            key={index}
          >
            {pageRecord[item].icon}
            <p>{item}</p>
          </Button>
        ))}
      </div>
    </div>
  );
}
