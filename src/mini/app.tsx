import { createRoot } from "react-dom/client";
import SpeechVocalization from "../components/SpeechVocalization";

const App = () => {
  window.controller.onReceiveTranscription((transcription) => {
    console.log("Transcription", transcription);
    window.clipboard.writeText(transcription.formatted_transcription); // Copy to clipboard
    new Notification("Transcription", {
      body: transcription.formatted_transcription,
    });
  });

  return (
    <div className="bg-transparent">
      <SpeechVocalization />
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<App />);
