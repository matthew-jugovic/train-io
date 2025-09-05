import { useEffect, useState } from "react";

const isTypingInInput = (el: Element | null): boolean => {
  if (!el) return false;
  const target = el as HTMLElement;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
};

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
      if (isTypingInInput(document.activeElement)) return;
      const key = codeMap[e.code];
      if (key) keysRef.current[key] = true;
    };

    const up = (e: KeyboardEvent) => {
      if (isTypingInInput(document.activeElement)) return;
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
