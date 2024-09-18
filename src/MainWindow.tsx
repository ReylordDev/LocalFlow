import { Button } from "./components/ui/button";
import SpeechVocalization from "./components/SpeechVocalization";
import { useEffect, useState } from "react";

const MainWindow = () => {
  const [backendInitialized, setBackendInitialized] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcription, setTranscription] = useState("");

  console.log("MainWindow");

  window.controller.onSetInitialized((initialized) => {
    console.log("Backend initialized", initialized);
    setBackendInitialized(initialized);
  });

  window.controller.onReceiveTranscription((transcription) => {
    console.log("Transcription", transcription);
    setTranscription(transcription.formatted_transcription);
  });

  useEffect(() => {
    window.controller.isInitialized().then((initialized) => {
      console.log("Backend initialized", initialized);
      setBackendInitialized(initialized);
    });
  }, []);

  if (!backendInitialized) {
    return <div> Loading...</div>;
  }

  return (
    <div className="flex flex-col justify-start items-center p-12">
      {recording ? (
        <div className="flex gap-4 items-center justify-between">
          <Button
            onClick={() => {
              window.controller.stop();
              setRecording(false);
            }}
          >
            Stop Recording
          </Button>
          <SpeechVocalization />
        </div>
      ) : (
        <Button
          onClick={() => {
            window.controller.start();
            setRecording(true);
          }}
        >
          Start Recording
        </Button>
      )}
      <div>
        <h1>Transcription</h1>
        <div className="border p-4 rounded-lg w-96 h-96 overflow-y-auto">
          <p id="transcription">{transcription}</p>
        </div>
      </div>
    </div>
  );
};

export default MainWindow;
