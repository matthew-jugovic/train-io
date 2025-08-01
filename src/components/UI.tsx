import { useContext } from "react";
import { TrainContext } from "../contexts/trainContext";
import "./UI.css";

type UIProps = {
  railsCollected: number;
  coalCollected: number;
};

export default function UI({ railsCollected, coalCollected }: UIProps) {
  const trainManager = useContext(TrainContext);

  if (!trainManager) {
    return (
      <div className="UI">
        <div>Coal Collected: {coalCollected}</div>
        <div>Error: Train context not available.</div>
      </div>
    );
  }

  const { carCount } = trainManager;
  const { addCar } = trainManager;
  const { removeCar } = trainManager;

  return (
    <div className="UI">
      <div>Rails Collected: {railsCollected}</div>
      <div>Coal Collected: {coalCollected}</div>
      <div style={{ marginTop: 10 }}>Current length: {carCount}</div>
      <div style={{ marginTop: 10 }}>
        <button onClick={() => removeCar()} style={{ marginRight: 8 }}>
          Remove Car
        </button>
        <button onClick={() => addCar()}>Add Car</button>
      </div>
    </div>
  );
}
