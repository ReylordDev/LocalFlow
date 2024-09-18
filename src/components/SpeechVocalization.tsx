import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
const SpeechVocalization = () => {
  const barCount = 10;
  const [speechActive, setSpeechActive] = useState(false);

  console.log("SpeechVocalization", speechActive);

  useEffect(() => {
    const interval = setInterval(() => {
      window.controller.requestAudioLevel();
      console.log("Requesting audio level");
    }, 500);

    return () => clearInterval(interval);
  }, []);

  window.controller.onReceiveAudioLevel(({ audio_level }) => {
    console.log("Audio level", audio_level);
    if (audio_level > 1) {
      setSpeechActive(true);
    } else {
      setSpeechActive(false);
    }
  });

  return (
    <div className="flex justify-center items-center bg-zinc-800 w-32 h-10 rounded-full gap-1 ">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-zinc-100 w-1 rounded-full",
            speechActive ? "animate-scale" : "h-1"
          )}
          style={{
            animationDuration: `${0.4 + Math.random()}s`,
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </div>
  );
};

export default SpeechVocalization;
