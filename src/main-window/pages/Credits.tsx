import { ExternalLink } from "lucide-react";
const Credits = () => {
  console.log("Credits");

  return (
    <div className="flex-col flex h-full w-full">
      <h1 className="font-bold text-5xl">Credits</h1>
      <div className="my-6"></div>
      <div className="flex flex-col gap-4">
        <p>Created by Luis Klocke as a personal project.</p>
        <div className="flex gap-2">
          <p>
            For more information, visit the project's{" "}
            <span
              className="underline underline-offset-2 cursor-pointer"
              onClick={() => {
                window.url.open("https://github.com/ReylordDev/LocalFlow");
              }}
            >
              GitHub repository
            </span>
          </p>
          <ExternalLink />
        </div>
        <p className="w-full flex gap-2">
          Inspired by
          <span
            className="font-bold underline underline-offset-2 cursor-pointer"
            onClick={() => {
              window.url.open("https://wisprflow.ai");
            }}
          >
            {" "}
            Flow
          </span>
          <ExternalLink />
        </p>
      </div>
    </div>
  );
};

export default Credits;
