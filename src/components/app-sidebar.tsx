import * as React from "react";

import { History, Settings, UserRound } from "lucide-react";
import { Page } from "../lib/models";

import { cn } from "../lib/utils";

const menu = [
  { icon: <Settings />, label: "Settings" },
  { icon: <History />, label: "History" },
  { icon: <UserRound />, label: "Credits" },
];

export function AppSidebar({
  currentPage,
  setPage,
}: {
  currentPage: Page;
  setPage: (page: Page) => void;
}) {
  return (
    <div className="flex flex-col w-96 border-r-2 border-gray-200 bg-background">
      <h1 className="text-3xl font-bold justify-center flex p-8 select-none text-text">
        LocalFlow
      </h1>
      <div className="px-4 text-lg font-semibold gap-4">
        {menu.map((item, index) => (
          <div
            className={cn(
              "flex items-center gap-4 rounded-xl cursor-pointer p-4 hover:bg-gray-200 text-text",
              currentPage === item.label && "bg-gray-100 "
            )}
            onClick={() => setPage(item.label as Page)}
            key={index}
          >
            {item.icon}
            <p>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
