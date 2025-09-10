import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { TrainContext } from "./trainContext";

type CollectibleContextType = {
  coalNum: number;
  maxCoal: number;
  addCoal: (amount: number) => void;
  consumeCoal: (amount: number) => boolean;
};

export const CollectibleContext = createContext<
  CollectibleContextType | undefined
>(undefined);

type Props = { children: ReactNode };

export const CollectibleProvider = ({ children }: Props) => {
  const trainManager = useContext(TrainContext);
  if (!trainManager) throw new Error("TrainContext must be available");

  const { totalCoalCapacity } = trainManager;
  const maxCoal = totalCoalCapacity;
  const coalRef = useRef(0);
  const [coalNum, setCoalNum] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCoalNum(Number(coalRef.current.toFixed(1)));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const addCoal = useCallback(
    (amount: number) => {
      coalRef.current = Math.min(coalRef.current + amount, totalCoalCapacity);
    },
    [totalCoalCapacity]
  );

  const consumeCoal = useCallback((amount: number) => {
    if (coalRef.current <= 0) return false;
    coalRef.current = Math.max(coalRef.current - amount, 0);
    return true;
  }, []);

  return (
    <CollectibleContext.Provider
      value={{
        coalNum,
        maxCoal,
        addCoal,
        consumeCoal,
      }}
    >
      {children}
    </CollectibleContext.Provider>
  );
};
