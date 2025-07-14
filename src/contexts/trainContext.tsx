import type { RapierRigidBody } from "@react-three/rapier";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Joint from "../components/Joint";
import Railcar from "../components/Railcar";

export const TrainContext = createContext<ITrainManager | null>(null);

export function TrainProvider({ children }: { children: React.ReactNode }) {
  const spacing = 6.105 + 1.75;
  const [trainRefs, setTrainRefs] = useState<
    Map<string, React.RefObject<RapierRigidBody>>
  >(new Map());
  const [joints, setJoints] = useState<React.ReactNode[]>([]);

  const [carCount, setCarCount] = useState(2);

  const [trainCars, setTrainCars] = useState<React.ReactElement[]>([]);

  useEffect(() => {
    const cars: React.ReactElement[] = [];

    for (let i = 0; i < carCount; i++) {
      const uid = (i + 1).toString();
      const position = spacing * (i + 1);
      cars.push(
        <Railcar uid={uid} position={[0, 1, position]} linearDamping={1} />
      );
    }

    setTrainCars(cars);
  }, [carCount]);

  useEffect(() => {
    if (trainRefs.size <= 1) return;
    const newJoints = [];

    const sortedKeys = Array.from(trainRefs.keys()).sort(
      (a, b) => Number(a) - Number(b)
    );
    const refs = sortedKeys
      .map((key) => trainRefs.get(key))
      .filter(
        (ref): ref is React.RefObject<RapierRigidBody> => ref !== undefined
      );

    for (let i = 1; i < trainRefs.size; i++) {
      newJoints.push(
        <Joint
          key={`joint-${sortedKeys[i - 1]}-${sortedKeys[i]}`}
          carRef1={refs[i - 1]}
          carRef2={refs[i]}
        />
      );
    }
    setJoints(newJoints);
  }, [trainRefs, setJoints]);

  const addTrainRef = useCallback(
    (key: string, trainRef: React.RefObject<RapierRigidBody>) => {
      setTrainRefs((prev) => {
        const map = new Map(prev);
        map.set(key, trainRef);
        return map;
      });
    },
    [setTrainRefs]
  );
  const removeTrainRef = useCallback(
    (key: string) => {
      setTrainRefs((prev) => {
        const map = new Map(prev);
        map.delete(key);
        return map;
      });
    },
    [setTrainRefs]
  );
  return (
    <TrainContext
      value={{
        joints,
        trainCars,
        addTrainRef,
        removeTrainRef,
        carCount,
        setCarCount,
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
  trainCars: React.ReactElement[];
  carCount: number;
  setCarCount: React.Dispatch<React.SetStateAction<number>>;
}

// class TrainManager {
//   private _trainRefs: Map<string, React.RefObject<RapierRigidBody>>;
//   private _joints: React.ReactNode[];
//   constructor() {
//     this._trainRefs = new Map();
//     this._joints = [];
//   }
//   public get trainRefs() {
//     return this._trainRefs;
//   }
//   public get joints() {
//     return this._joints;
//   }
//   public addTrainRef(key: string, trainRef: React.RefObject<RapierRigidBody>) {
//     this._trainRefs.set(key, trainRef);
//     this._updateJoints();
//   }
//   public removeTrainRef(key: string) {
//     this._trainRefs.delete(key);
//     this._updateJoints();
//   }
//   private _updateJoints() {
//     if (this._trainRefs.size <= 1) return;
//     const joints = [];
//     const trainRefs = Array.from(this._trainRefs.values());
//     for (let i = 1; i < this.trainRefs.size; i++) {
//       joints.push(<Joint carRef1={trainRefs[i - 1]} carRef2={trainRefs[i]} />);
//     }
//   }
// }
