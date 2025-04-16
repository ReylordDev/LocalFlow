import { useState } from "react";
import Credits from "./pages/Credits";
import Modes from "./pages/Modes";
import AudioPage from "./pages/Audio";
import { AppSidebar } from "../components/app-sidebar";
import { Page } from "../lib/models/ui";
import ConfigurationPage from "./pages/Configuration";
import TextReplacements from "./pages/TextReplacements";

const MainWindow = () => {
  console.debug("MainWindow rendered");
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
      case "Text Replacements":
        return <TextReplacements />;
    }
  }

  return (
    <div className="flex h-screen w-screen select-none justify-start">
      <AppSidebar currentPage={page} setPage={setPage} />
      <div className="w-full bg-white">{renderPage(page)}</div>
    </div>
  );
};

export default MainWindow;
