import { useContext } from "react";
import { TrainContext } from "../contexts/trainContext";
import { PassengerContext } from "../contexts/passengerContext";
import "./UI.css";

type UIProps = {
  railsCollected: number;
  coalCollected: number;
};

export default function UI({ railsCollected, coalCollected }: UIProps) {
  const trainManager = useContext(TrainContext);
  const passengerManager = useContext(PassengerContext);

  if (!trainManager || !passengerManager) {
    return (
      <div className="UI">
        <div>Error: Train context not available.</div>
      </div>
    );
  }

  const { carCount } = trainManager;
  const { addCar } = trainManager;
  const { removeCar } = trainManager;
  const { passengers, maxPassengers } = passengerManager;

  return (
    <div className="UI">
      <div>Rails Collected: {railsCollected}</div>
      <div>Coal Collected: {coalCollected}</div>
      <div style={{ marginTop: 20 }}>Current length: {carCount}</div>
      <div style={{ marginTop: 10 }}>
        <button onClick={() => removeCar()}>Remove Car</button>
        <button onClick={() => addCar()}>Add Car</button>
        <div>
          Passengers: {passengers} / {maxPassengers}
        </div>
      </div>
    </div>
  );
}
