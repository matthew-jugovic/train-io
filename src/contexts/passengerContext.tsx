import React, { createContext, useState, useCallback, useEffect } from "react";

type Passenger = {
  destination: string;
};

export type PassengersContextType = {
  money: number;
  addMoney: (amount: number) => void;
  passengers: Passenger[];
  maxPassengers: number;
  addPassenger: (fromStation: string) => void;
  deliverPassengers: (dropStation: string) => void;
  stations: string[];
  registerStation: (name: string) => void;
};

export const PassengerContext = createContext<PassengersContextType | null>(
  null
);

export const PassengerProvider: React.FC<{
  maxPassengers: number;
  children: React.ReactNode;
}> = ({ maxPassengers, children }) => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [stations, setStations] = useState<string[]>([]);
  const [money, setMoney] = useState(0);
  const addMoney = (amount: number) => setMoney((prev) => prev + amount);

  useEffect(() => {
    console.log("PassengerContext mounted");
  }, []);

  const registerStation = useCallback((name: string) => {
    setStations((prev) => {
      return [...prev, name];
    });
  }, []);

  const addPassenger = useCallback(
    (currStation: string) => {
      setPassengers((prev) => {
        if (prev.length >= maxPassengers) return prev;

        const availableStations = stations.filter((s) => s !== currStation);
        if (availableStations.length === 0) return prev;

        const randomStation =
          availableStations[
            Math.floor(Math.random() * availableStations.length)
          ];
        console.log("destination: " + randomStation);

        return [...prev, { destination: randomStation }];
      });
    },
    [stations, maxPassengers]
  );

  const deliverPassengers = useCallback(
    (dropStation: string) => {
      setPassengers((prev) => {
        const remaining = prev.filter((p) => p.destination !== dropStation);
        const deliveredCount = prev.length - remaining.length;

        if (deliveredCount > 0) {
          setMoney(() => money + deliveredCount);
          console.log(`Dropped off ${deliveredCount} passenger(s)`);
        }

        return remaining;
      });
    },
    [money]
  );

  return (
    <PassengerContext.Provider
      value={{
        money,
        addMoney,
        passengers,
        maxPassengers,
        addPassenger,
        deliverPassengers,
        stations,
        registerStation,
      }}
    >
      {children}
    </PassengerContext.Provider>
  );
};
