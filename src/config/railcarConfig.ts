import type { CuboidArgs } from "@react-three/rapier";

export const railcarConfig = {
  coal: {
    model: "/coalCar/coalCar.gltf",
    carPosition: [0, 0, 0] as [number, number, number],
    scale: [0.45, 0.5, 0.65] as [number, number, number],
    collider: { args: [1.2, 1, 3.8] as CuboidArgs },
    stats: {
      coalCapacity: 5,
      passengerCapacity: 0,
    },
  },
  passenger: {
    model: "/PassengerCar.glb",
    carPosition: [0, 0.45, 0] as [number, number, number],
    scale: [0.9, 0.9, 0.9] as [number, number, number],
    collider: { args: [1.2, 1, 4] as CuboidArgs },
    stats: {
      coalCapacity: 0,
      passengerCapacity: 20,
    },
  },
};

export type CarType = keyof typeof railcarConfig;
