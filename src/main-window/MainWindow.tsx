import Settings from "./Settings";

const MainWindow = () => {
  console.log("MainWindow");

  return (
    <div className="flex justify-start h-screen w-screen">
      <div className="flex flex-col justify-start items-center w-64 font-semibold border-r-2 border-black">
        <div className="border-y w-full py-4 text-center hover:bg-slate-300">
          Settings
        </div>
        <div className="border-y w-full py-4 text-center hover:bg-slate-300">
          Settings
        </div>
        <div className="border-y w-full py-4 text-center hover:bg-slate-300">
          Settings
        </div>
      </div>
      <div className="px-8 py-16 bg-red-300 w-full">
        <Settings />
      </div>
    </div>
  );
};

export default MainWindow;
