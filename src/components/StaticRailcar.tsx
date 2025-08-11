import type { FC } from "react";
import type { XYZ } from "../types/XYZ";
import { RigidBody } from "@react-three/rapier";
import { useLoader } from "@react-three/fiber";
import { useContext, useMemo, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TrainContext } from "../contexts/trainContext";

type StaticRailcarProps = {
  position: XYZ;
  rotation?: [number, number, number];
};

const StaticRailcar: FC<StaticRailcarProps> = ({ position, rotation }) => {
  const trainModel = useLoader(GLTFLoader, "/coalCar/coalCar.gltf");
  const [collected, setCollected] = useState(false);
  const collectedRef = useRef(false);
  const trainManager = useContext(TrainContext);

  const model = useMemo(() => {
    return trainModel.scene.clone(true);
  }, [trainModel]);

  if (!trainManager) return null;

  if (collected) return null;

  return (
    <RigidBody
      name="StaticCar"
      type="dynamic"
      colliders="trimesh"
      position={position}
      rotation={rotation}
      onCollisionEnter={(event) => {
        if (collectedRef.current) return;

        const other = event.other;
        if (other.rigidBodyObject?.name === "train") {
          collectedRef.current = true;
          setCollected(true);
          trainManager.addCar();
        }
      }}
    >
      <primitive
        object={model}
        scale={[0.4, 0.5, 0.65]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </RigidBody>
  );
};

export default StaticRailcar;
