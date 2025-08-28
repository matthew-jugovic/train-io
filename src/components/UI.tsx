import { useContext, useEffect, useState } from "react";
import { TrainContext } from "../contexts/trainContext";
import { PassengerContext } from "../contexts/passengerContext";
import { CollectibleContext } from "../contexts/collectibleContext";
import "./UI.css";

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
  const { passengers, maxPassengers, money, setMoney } = passengerManager;
  const { coalNum, maxCoal } = collectibleManager;

  // Count passengers per destination
  const destinations: Record<string, number> = {};
  passengers.forEach((p) => {
    destinations[p.destination] = (destinations[p.destination] || 0) + 1;
  });

  const coalPercentage = Math.min((coalNum / maxCoal) * 100, 100);
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <div className="UIElements">
      <div className="UI">
        <div className="UI-left" style={{ width: 320 }}>
          <div>Rails Collected: {railsCollected}</div>
          <div style={{ marginTop: 10 }}>Train Size: {carCount}</div>
          <div style={{ marginTop: 10 }}>
            {/* <button onClick={() => addCar("coal")}>Add Coal Car</button>
            <button onClick={() => addCar("passenger")}>
              Add Passenger Car
            </button> */}
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
        <strong className="shop-container">
          <button onClick={() => setShopOpen(true)}>Shop</button>

          {shopOpen && (
            <div className="shop-ui">
              <div className="shop-content">
                <h2>Train Shop</h2>
                <p>Purchase Train Cars!</p>

                <button
                  onClick={() => {
                    if (money >= 15) {
                      addCar("coal");
                      setMoney(money - 15);
                    }
                  }}
                >
                  Buy Coal Car - $15
                </button>
                <button
                  onClick={() => {
                    if (money >= 20) {
                      addCar("passenger");
                      setMoney(money - 20);
                    }
                  }}
                >
                  Buy Passenger Car - $20
                </button>
                <button
                  style={{ background: "red" }}
                  onClick={() => setShopOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </strong>
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
