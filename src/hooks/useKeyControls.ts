import { useEffect, useState } from "react";

const useKeyControls = () => {
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });
  useEffect(() => {
    function down(e: { key: PropertyKey }) {
      if (keys.hasOwnProperty(e.key)) setKeys((k) => ({ ...k, [e.key]: true }));
    }
    function up(e: { key: PropertyKey }) {
      if (keys.hasOwnProperty(e.key))
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
