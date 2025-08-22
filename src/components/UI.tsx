import { useContext, useEffect, useState } from "react";
import { TrainContext } from "../contexts/trainContext";
import { PassengerContext } from "../contexts/passengerContext";
import { CollectibleContext } from "../contexts/collectibleContext";
import "./UI.css";
import { color } from "three/src/nodes/TSL.js";

type UIProps = {
  railsCollected: number;
};

export default function UI({ railsCollected }: UIProps) {
  const trainManager = useContext(TrainContext);
  const passengerManager = useContext(PassengerContext);
  const collectibleManager = useContext(CollectibleContext);

  if (!trainManager || !passengerManager || !collectibleManager) {
    return (
      <div className="UI">
        <div>Error: context not available.</div>
      </div>
    );
  }

  const { carCount, addCar, removeCar } = trainManager;
  const { passengers, maxPassengers, money } = passengerManager;
  const { coalNum, maxCoal } = collectibleManager;
  // Count passengers per destination
  const destinations: Record<string, number> = {};
  passengers.forEach((p) => {
    destinations[p.destination] = (destinations[p.destination] || 0) + 1;
  });

  const coalPercentage = Math.min((coalNum / maxCoal) * 100, 100);

  return (
    <div className="UIElements">
      <div className="UI">
        <div className="UI-left">
          <div>Rails Collected: {railsCollected}</div>
          <div style={{ marginTop: 20 }}>Train Size: {carCount}</div>
          <div style={{ marginTop: 10 }}>
            <button onClick={addCar}>Add Car</button>
            <button style={{ background: "red" }} onClick={removeCar}>
              Remove Car
            </button>
          </div>
        </div>

        <div className="UI-right">
          <div style={{ fontSize: 25 }}>
            Passengers: {passengers.length} / {maxPassengers}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ paddingBottom: 2, fontSize: 30 }}>Stops: </div>
            <ul>
              {Object.entries(destinations).map(([destination, count]) => (
                <li key={destination}>
                  {destination.replace("_", " ")}: {count}
                </li>
              ))}
              {passengers.length === 0 && <li>No passengers</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="UI-money">
        <div>
          <strong>Money:</strong> ${money}
        </div>
      </div>

      <div className="coal-bar-container">
        <div
          className="coal-bar-fill"
          style={{ width: `${coalPercentage}%` }}
        ></div>
        <span className="coal-bar-text">
          {coalNum} / {maxCoal} Coal
        </span>
      </div>
    </div>
  );
}
