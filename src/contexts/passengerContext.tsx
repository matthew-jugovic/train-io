import React, { createContext, useContext, useState } from "react";

type PassengersContextType = {
  passengers: number;
  maxPassengers: number;
  addPassengers: (count: number) => void;
};

export const PassengerContext = createContext<PassengersContextType | null>(
  null
);

export const PassengerProvider: React.FC<{
  maxPassengers: number;
  children: any;
}> = ({ maxPassengers, children }) => {
  const [passengers, setPassengers] = useState(0);

  const addPassengers = (count: number) => {
    setPassengers((prev) => Math.min(prev + count, maxPassengers));
  };

  return (
    <PassengerContext.Provider
      value={{ passengers, maxPassengers, addPassengers }}
    >
      {children}
    </PassengerContext.Provider>
  );
};
