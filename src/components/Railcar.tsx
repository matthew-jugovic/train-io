import type { FC, Ref } from "react";
import type { XYZ } from "../types/XYZ";
import {
  RapierRigidBody,
  RigidBody,
  type RigidBodyProps,
} from "@react-three/rapier";
import { useLoader } from "@react-three/fiber";
import { useContext, useEffect, useMemo, useRef } from "react";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Mesh } from "three";
import { TrainContext } from "../contexts/trainContext";

type RailcarProps = {
  position: XYZ;
  color?: string;
  refProp?: Ref<any>;
  uid: string;
} & Partial<RigidBodyProps>;

const Railcar: FC<RailcarProps> = ({
  position,
  color,
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
  }, [trainManager, carRef]);

  const model = useMemo(() => {
    const cloned = trainModel.scene.clone(true);

    cloned.traverse((child) => {
      if ((child as any).isMesh && (child as any).material) {
        const mesh = child as Mesh;

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat: { clone: () => any }) => {
            const newMat = mat.clone();
            newMat.color.set(color);
            return newMat;
          });
        } else {
          mesh.material = mesh.material.clone();
          mesh.material.color.set(color);
        }
      }
    });

    return (
      <primitive
        object={cloned}
        scale={[0.4, 0.5, 0.65]}
        position={[0, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
    );
  }, [trainModel, color]);

  return (
    <RigidBody
      colliders="trimesh"
      ref={carRef}
      mass={1}
      position={position}
      {...rigidBodyProps}
    >
      {model}
    </RigidBody>
  );
};
export default Railcar;
