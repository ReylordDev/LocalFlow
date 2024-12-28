import { useState } from "react";
import Settings from "./Settings";
import Status from "./Status";

const MainWindow = () => {
  console.log("MainWindow");
  const [page, setPage] = useState<"settings" | "status">("settings");

  return (
    <div className="flex justify-start h-screen w-screen">
      <div className="flex flex-col justify-start items-center w-64 font-semibold border-r-2 border-black">
        <button
          className="border-y w-full py-4 text-center hover:bg-slate-300"
          onClick={() => setPage("settings")}
        >
          Settings
        </button>
        <button
          className="border-y w-full py-4 text-center hover:bg-slate-300"
          onClick={() => setPage("status")}
        >
          Status
        </button>
      </div>
      <div className="px-8 py-16 bg-red-300 w-full">
        {page === "settings" ? <Settings /> : <Status />}
      </div>
    </div>
  );
};

export default MainWindow;
