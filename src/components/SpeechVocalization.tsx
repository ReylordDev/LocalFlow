import { useEffect, useMemo, useState } from "react";
import { cn } from "../lib/utils";

const SpeechVocalization = () => {
  const barCount = 10;
  const [audioLevel, setAudioLevel] = useState(0);
  const [timer, setTimer] = useState(0);
  const [recording, setRecording] = useState(false);

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
      window.mini.requestAudioLevel();
      console.log("Requesting audio level");
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (recording) {
      timerInterval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else {
      clearInterval(timerInterval);
      setTimer(0);
    }

    return () => clearInterval(timerInterval);
  }, [recording]);

  window.mini.onReceiveAudioLevel((audioLevel) => {
    console.log("Audio level", audioLevel);
    setAudioLevel(audioLevel);
  });

  window.mini.onRecordingStart(() => {
    console.log("Recording started");
    setRecording(true);
  });

  window.mini.onRecordingStop(() => {
    console.log("Recording stopped");
    setRecording(false);
  });

  console.log("Audio level", audioLevel);
  console.log("Timer", timer);

  return (
    <div
      className={cn(
        "flex gap-2 h-10 bg-zinc-800 rounded-full p-1 px-4 justify-center drag",
        timer > 0 ? (timer > 600 ? "w-40" : "w-36") : "w-32"
      )}
    >
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
      {timer > 0 ? (
        <div className="flex justify-center text-white items-center">
          {formatTimer(timer)}
        </div>
      ) : null}
    </div>
  );
};

export default SpeechVocalization;

function formatTimer(timer: number) {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
