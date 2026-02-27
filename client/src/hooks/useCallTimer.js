// useCallTimer.js
import { useEffect, useRef, useState } from "react";

const useCallTimer = (start) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (start) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [start]);

  const formattedTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const resetTimer = () => setSeconds(0);

  return { formattedTime: formattedTime(), resetTimer };
};

export default useCallTimer;