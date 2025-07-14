import { useContext } from "react";
import { TrainContext } from "../contexts/trainContext";
import "./UI.css";

type UIProps = {
  coalCollected: number;
};

export default function UI({ coalCollected }: UIProps) {
  const trainManager = useContext(TrainContext);

  if (!trainManager) {
    return (
      <div className="UI">
        <div>Coal Collected: {coalCollected}</div>
        <div>Error: Train context not available.</div>
      </div>
    );
  }

  const { carCount, setCarCount } = trainManager;

  return (
    <div className="UI">
      <div>Coal Collected: {coalCollected}</div>
      <div style={{ marginTop: 10 }}>Current length: {carCount}</div>
      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => setCarCount((count) => Math.max(1, count - 1))}
          style={{ marginRight: 8 }}
        >
          Remove Car
        </button>
        <button onClick={() => setCarCount((count) => count + 1)}>
          Add Car
        </button>
      </div>
    </div>
  );
}
