import { useEffect, useState } from "react";

const isTypingInInput = (el: Element | null): boolean => {
  if (!el) return false;
  const target = el as HTMLElement;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
};

const useKeyControls = () => {
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });
  useEffect(() => {
    function down(e: { key: PropertyKey }) {
      if (isTypingInInput(document.activeElement)) return;
      if (Object.prototype.hasOwnProperty.call(keys, e.key)) setKeys((k) => ({ ...k, [e.key]: true }));
    }
    function up(e: { key: PropertyKey }) {
      if (isTypingInInput(document.activeElement)) return;
      if (Object.prototype.hasOwnProperty.call(keys, e.key))
        setKeys((k) => ({ ...k, [e.key]: false }));
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  return keys;
};
export default useKeyControls;
