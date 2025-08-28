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
import { railcarConfig, type CarType } from "../config/railcarConfig";

type RailcarProps = {
  carType: CarType;
  position: XYZ;
  refProp?: Ref<any>;
  uid: string;
} & Partial<RigidBodyProps>;

const Railcar: FC<RailcarProps> = ({
  carType,
  position,
  refProp,
  uid,
  ...rigidBodyProps
}) => {
  const carRef = useRef<RapierRigidBody>(null);
  const trainManager = useContext(TrainContext);

  const {
    model: modelPath,
    carPosition,
    scale,
    collider,
  } = railcarConfig[carType];
  const trainModel = useLoader(GLTFLoader, modelPath);

  useEffect(() => {
    if (!trainManager || !carRef.current) return;
    trainManager.addTrainRef(uid, carRef as React.RefObject<RapierRigidBody>);
    return () => {
      trainManager.removeTrainRef(uid);
    };
  }, [uid]);

  const model = useMemo(() => {
    const cloned = trainModel.scene.clone(true);

    return cloned;
  }, [trainModel]);

  return (
    <RigidBody
      key={uid}
      colliders={false}
      ref={carRef}
      linearDamping={2}
      angularDamping={1}
      position={position}
      {...rigidBodyProps}
    >
      <CuboidCollider {...collider} />
      <primitive
        object={model}
        scale={scale}
        position={carPosition}
        rotation={[0, Math.PI / 2, 0]}
      />
    </RigidBody>
  );
};
export default Railcar;
