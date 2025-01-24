import { useState } from "react";
import Settings from "./Settings";
import History from "./History";
import Credits from "./Credits";
import { AppSidebar } from "../components/app-sidebar";
import { Page } from "../lib/models";
const MainWindow = () => {
  console.log("MainWindow");
  const [page, setPage] = useState<Page>("History");

  function renderPage(page: Page) {
    switch (page) {
      case "Settings":
        return <Settings />;
      case "History":
        return <History />;
      case "Credits":
        return <Credits />;
    }
  }

  return (
    <div className="flex justify-start h-screen w-screen">
      <AppSidebar currentPage={page} setPage={setPage} />
      <div className="px-8 py-16 bg-white w-full">{renderPage(page)}</div>
    </div>
  );
};

export default MainWindow;
