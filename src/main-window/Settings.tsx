const MainWindow = () => {
  console.log("Settings");

  return (
    <div className="bg-green-300 h-full w-full">
      <h1 className="font-bold text-3xl">Settings</h1>
      <div className="flex flex-col gap-4 bg-blue-300 p-4">
        <div className="flex justify-between gap-8">
          <p>Activation Shortcut</p>
          <div>Ctrl + Alt + y</div>
        </div>
        <div className="flex justify-between gap-8">
          <p>Mini-Window Position</p>
          <div>Center - Middle</div>
        </div>
      </div>
    </div>
  );
};

export default MainWindow;
