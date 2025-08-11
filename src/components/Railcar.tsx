import type { FC, Ref } from "react";
import type { XYZ } from "../types/XYZ";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
  type RigidBodyProps,
} from "@react-three/rapier";
import { useLoader } from "@react-three/fiber";
import { useContext, useEffect, useMemo, useRef } from "react";
import { TrainContext } from "../contexts/trainContext";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type RailcarProps = {
  position: XYZ;
  refProp?: Ref<any>;
  uid: string;
} & Partial<RigidBodyProps>;

const Railcar: FC<RailcarProps> = ({
  position,
  refProp,
  uid,
  ...rigidBodyProps
}) => {
  const carRef = useRef<RapierRigidBody>(null);
  const trainManager = useContext(TrainContext);
  const trainModel = useLoader(GLTFLoader, "/coalCar/coalCar.gltf");
  useEffect(() => {
    if (!trainManager || !carRef.current) return;
    trainManager.addTrainRef(uid, carRef as React.RefObject<RapierRigidBody>);
    return () => {
      trainManager.removeTrainRef(uid);
    };
  }, [trainManager]);

  const model = useMemo(() => {
    const cloned = trainModel.scene.clone(true);

    return cloned;
  }, [trainModel]);

  return (
    <RigidBody
      colliders={false}
      ref={carRef}
      linearDamping={2}
      angularDamping={1}
      position={position}
      {...rigidBodyProps}
    >
      <CuboidCollider args={[1.2, 1, 3.5]} position={[0, 0, 0]} />
      <primitive
        object={model}
        scale={[0.4, 0.5, 0.65]}
        position={[0, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </RigidBody>
  );
};
export default Railcar;
