import { useEffect, useRef } from "react";

type KeysState = {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  space: boolean;
};

export const useKeyControls = () => {
  const keysRef = useRef<KeysState>({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
  });

  useEffect(() => {
    const codeMap: Record<string, keyof KeysState> = {
      KeyW: "w",
      KeyA: "a",
      KeyS: "s",
      KeyD: "d",
      Space: "space",
    };

    const down = (e: KeyboardEvent) => {
      const key = codeMap[e.code];
      if (key) keysRef.current[key] = true;
    };

    const up = (e: KeyboardEvent) => {
      const key = codeMap[e.code];
      if (key) keysRef.current[key] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return keysRef;
};
