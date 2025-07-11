import type { RapierRigidBody } from "@react-three/rapier";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Joint from "../components/Joint";

export const TrainContext = createContext<ITrainManager | null>(null);

export function TrainProvider({ children }: { children: React.ReactNode }) {
  const [trainRefs, setTrainRefs] = useState<
    Map<string, React.RefObject<RapierRigidBody>>
  >(new Map());
  const [joints, setJoints] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    if (trainRefs.size <= 1) return;
    const newJoints = [];
    const refs = Array.from(trainRefs.values()).reverse();
    for (let i = 1; i < trainRefs.size; i++) {
      newJoints.push(<Joint carRef1={refs[i - 1]} carRef2={refs[i]} />);
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
        addTrainRef,
        removeTrainRef,
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
