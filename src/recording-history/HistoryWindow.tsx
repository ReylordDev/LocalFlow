import { Result } from "../lib/models";
import { useEffect, useState } from "react";

const HistoryWindow = () => {
  const [history, setHistory] = useState<Result[]>([]);

  useEffect(() => {
    window.recordingHistory.requestAll();

    const unsubscribe = window.recordingHistory.onReceiveResults((results) => {
      setHistory(results);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex justify-start h-screen w-screen select-none">
      {history.length > 0 ? (
        <div className="flex flex-col w-full h-full overflow-y-auto bg-gray-100 p-4">
          <h1 className="text-2xl font-bold mb-4">Recording History</h1>
          <div className="flex flex-col space-y-4">
            {history.map((result, index) => (
              <div
                key={index}
                className="p-4 bg-white rounded shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <h2 className="text-xl font-semibold">
                  {result.mode.use_language_model
                    ? result.ai_result
                    : result.transcription}
                </h2>
                <p className="text-gray-600">
                  {result.mode.use_language_model
                    ? result.transcription
                    : result.ai_result}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-100">
          <h1 className="text-2xl font-bold">No recording history available</h1>
        </div>
      )}
    </div>
  );
};

export default HistoryWindow;
