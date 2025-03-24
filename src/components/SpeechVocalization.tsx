import { useEffect, useMemo, useState } from "react";
import { cn } from "../lib/utils";

const SpeechVocalization = ({ isRecording }: { isRecording: boolean }) => {
  const barCount = 75;
  const [audioLevel, setAudioLevel] = useState(0);

  // Generate random factors for each bar, biased towards the center
  const randomFactors = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      const distanceFromCenter = Math.abs(i - (barCount - 1) / 2);
      const centerBias = 1 - distanceFromCenter / ((barCount - 1) / 2);
      return Math.random() * 0.5 + centerBias * 0.5; // Range: 0.5 to 1
    });
  }, [audioLevel]);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        window.mini.requestAudioLevel();
        console.log("Requesting audio level");
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isRecording]);

  useEffect(() => {
    const unsubscribe = window.mini.onReceiveAudioLevel((audioLevel) => {
      console.log("Audio level", audioLevel);
      setAudioLevel(audioLevel);
    });

    return () => unsubscribe();
  }, []);

  console.log("Audio level", audioLevel);

  return (
    <div className={cn("flex gap-2 h-10 rounded-full p-1 px-4 justify-center")}>
      <div className="flex justify-center items-center gap-1 ">
        {randomFactors.map((factor, i) => (
          <div
            key={i}
            className={cn(
              "bg-zinc-100 w-1 rounded-full transition-all duration-300",
              audioLevel > 1 ? "ease-in-out" : "animate-none"
            )}
            style={{
              animationDuration: `${0.5 + Math.random() * 0.1}s`,
              animationIterationCount: "infinite",
              height:
                audioLevel > 1 ? `${Math.min(10 + 60 * factor, 70)}%` : "10%",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SpeechVocalization;
