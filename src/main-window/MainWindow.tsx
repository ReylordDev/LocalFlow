import { useState } from "react";
import Settings from "./Settings";
import History from "./History";
import Credits from "./Credits";
import { AppSidebar } from "../components/app-sidebar";
import { Page } from "../lib/models";
const MainWindow = () => {
  console.log("MainWindow");
  const [page, setPage] = useState<Page>("Settings");

  return (
    <div className="flex justify-start h-screen w-screen">
      <AppSidebar currentPage={page} setPage={setPage} />
      <div className="px-8 py-16 bg-white w-full">
        {page === "Settings" ? (
          <Settings />
        ) : page === "History" ? (
          <History />
        ) : (
          <Credits />
        )}
      </div>
    </div>
  );
};

export default MainWindow;
