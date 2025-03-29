import { useState } from "react";
import Credits from "./pages/Credits";
import Modes from "./pages/Modes";
import AudioPage from "./pages/Audio";
import { AppSidebar } from "../components/app-sidebar";
import { Page } from "../lib/models";
import ConfigurationPage from "./pages/Configuration";
const MainWindow = () => {
  console.log("MainWindow");
  const [page, setPage] = useState<Page>("Modes");

  function renderPage(page: Page) {
    switch (page) {
      case "Modes":
        return <Modes />;
      case "Configuration":
        return <ConfigurationPage />;
      case "Credits":
        return <Credits />;
      case "Audio":
        return <AudioPage />;
    }
  }

  return (
    <div className="flex justify-start h-screen w-screen select-none">
      <AppSidebar currentPage={page} setPage={setPage} />
      <div className="bg-white w-full">{renderPage(page)}</div>
    </div>
  );
};

export default MainWindow;
