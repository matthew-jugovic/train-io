import type { RapierRigidBody } from "@react-three/rapier";
import { createContext, useCallback, useEffect, useState } from "react";
import Joint from "../components/Joint";
import Railcar from "../components/Railcar";
import { Euler, Quaternion, Vector3 } from "three";
import { railcarConfig } from "../config/railcarConfig";

interface CarEntry {
  railcar: React.ReactElement;
  stats: {
    coalCapacity: number;
    passengerCapacity: number;
  };
}

export const TrainContext = createContext<ITrainManager | null>(null);

export function TrainProvider({ children }: { children: React.ReactNode }) {
  const spacing = 6.105 + 2.25;
  const [trainRefs, setTrainRefs] = useState<
    Map<string, React.RefObject<RapierRigidBody>>
  >(new Map());
  const [joints, setJoints] = useState<React.ReactNode[]>([]);
  const [carCount, setCarCount] = useState(1);
  const [trainCars, setTrainCars] = useState<CarEntry[]>([]);
  const totalPassengerCapacity = trainCars.reduce(
    (sum, car) => sum + (car.stats.passengerCapacity ?? 0),
    0
  );
  const totalCoalCapacity = trainCars.reduce(
    (sum, car) => sum + (car.stats.coalCapacity ?? 0),
    0
  );

  useEffect(() => {
    console.log("TrainContext mounted");
  }, []);

  useEffect(() => {
    if (trainRefs.size <= 1) return;
    const newJoints = [];

    for (let i = 1; i < trainRefs.size; i++) {
      const ref1 = trainRefs.get((i - 1).toString());
      const ref2 = trainRefs.get(i.toString());

      if (!ref1 || !ref2) return;
      newJoints.push(
        <Joint key={`joint-${i - 1}-${i}`} carRef1={ref1} carRef2={ref2} />
      );
    }
    setJoints(newJoints);
  }, [trainRefs]);

  // create initial cart
  useEffect(() => {
    const type = "passenger";
    const uid = "1";

    const railcar = (
      <Railcar
        carType={type}
        key={uid}
        uid={uid}
        position={[0, 2, spacing]}
        linearDamping={1}
      />
    );

    const stats = {
      coalCapacity: railcarConfig[type].stats.coalCapacity ?? 0,
      passengerCapacity: railcarConfig[type].stats.passengerCapacity ?? 0,
    };

    setTrainCars([{ railcar, stats }]);
  }, [spacing]);

  const addTrainRef = useCallback(
    (key: string, trainRef: React.RefObject<RapierRigidBody>) => {
      setTrainRefs((prev) => {
        const map = new Map(prev);
        map.set(key, trainRef);
        return map;
      });
    },
    []
  );
  const removeTrainRef = useCallback((key: string) => {
    setTrainRefs((prev) => {
      const map = new Map(prev);
      map.delete(key);
      return map;
    });
  }, []);

  const addCar = useCallback(
    (type: keyof typeof railcarConfig) => {
      const lastKey = carCount.toString();
      const lastRef = trainRefs.get(lastKey);

      if (!lastRef?.current) return;
      const uid = (carCount + 1).toString();

      // calculate rotation
      const lastRot = lastRef.current.rotation();
      const q = new Quaternion(lastRot.x, lastRot.y, lastRot.z, lastRot.w);
      const forward = new Vector3(0, 0, 1).applyQuaternion(q).normalize();
      const newRot = new Euler().setFromQuaternion(q, "YXZ");

      // calculate position
      const lastPos = lastRef.current.translation();
      const newX = lastPos.x + forward.x * spacing;
      const newZ = lastPos.z + forward.z * spacing;

      // create railcar element
      const railcar = (
        <Railcar
          carType={type}
          key={uid}
          uid={uid}
          position={[newX, 2, newZ]}
          rotation={[newRot.x, newRot.y, newRot.z]}
          linearDamping={1}
        />
      );

      // read stats from config
      const stats = {
        coalCapacity: railcarConfig[type].stats.coalCapacity ?? 0,
        passengerCapacity: railcarConfig[type].stats.passengerCapacity ?? 0,
      };

      // add to state
      setTrainCars((prev) => [...prev, { railcar, stats }]);
      setCarCount((count) => count + 1);
    },
    [trainRefs, carCount, spacing]
  );

  const removeCar = useCallback(() => {
    if (carCount <= 1) return;
    const newTrainCars = trainCars.slice(0, -1);

    setTrainCars(newTrainCars);
    removeTrainRef(carCount.toString());
    setCarCount(carCount - 1);
  }, [carCount, trainCars, removeTrainRef]);

  return (
    <TrainContext
      value={{
        joints,
        trainCars,
        trainRefs,
        addTrainRef,
        removeTrainRef,
        carCount,
        addCar,
        removeCar,
        totalCoalCapacity,
        totalPassengerCapacity,
      }}
    >
      {children}
    </TrainContext>
  );
}

interface ITrainManager {
  joints: React.ReactNode[];
  addTrainRef: (
    key: string,
    trainRef: React.RefObject<RapierRigidBody>
  ) => void;
  removeTrainRef: (key: string) => void;
  trainCars: CarEntry[];
  trainRefs: Map<string, React.RefObject<RapierRigidBody>>;
  carCount: number;
  addCar: (type: keyof typeof railcarConfig) => void;
  removeCar: () => void;
  totalPassengerCapacity: number;
  totalCoalCapacity: number;
}
