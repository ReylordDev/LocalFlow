import { useEffect, useMemo, useState } from "react";
import { cn } from "../lib/utils";

const SpeechVocalization = () => {
  const barCount = 10;
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
    const interval = setInterval(() => {
      window.controller.requestAudioLevel();
      console.log("Requesting audio level");
    }, 500);

    return () => clearInterval(interval);
  }, []);

  window.controller.onReceiveAudioLevel((audioLevel) => {
    console.log("Audio level", audioLevel);
    setAudioLevel(audioLevel);
  });

  return (
    <div className="flex justify-center items-center bg-zinc-800 w-32 h-10 rounded-full gap-1 ">
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
              audioLevel > 1
                ? `${Math.min(10 + audioLevel * 7 * factor, 70)}%`
                : "10%",
          }}
        />
      ))}
    </div>
  );
};

export default SpeechVocalization;
