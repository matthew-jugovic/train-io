import { useEffect, useRef } from "react";

export default function TrainWhistleController({ moving }: { moving: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/woodenTrainWhistle.mp3");
  }, []);

  useEffect(() => {
    if (moving && audioRef.current) {
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch((e) =>
            console.warn("Playback blocked:", e)
          );
        }
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [moving]);

  return null;
}
