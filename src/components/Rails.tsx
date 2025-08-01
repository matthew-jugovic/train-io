import { RigidBody } from "@react-three/rapier";
import { useState, useRef, useMemo } from "react";
import type { RapierRigidBody } from "@react-three/rapier";
import { useFrame, useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import type { XYZ } from "../types/XYZ";
import React from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type RailProps = {
  id: number;
  position: XYZ;
  dimensions?: [number, number, number];
  onCollect?: (id: number) => void; //this is how you make it optional
};

function Rails({ id, position, dimensions, onCollect }: RailProps) {
  const [collected, setCollected] = useState(false);
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  useFrame(() => {
    if (rigidBodyRef.current && !collected) {
      // Apply a small clockwise torque impulse (Y axis)
      rigidBodyRef.current.setAngvel({ x: 0, y: -1, z: 0 }, true);
    }
  });

  if (collected) return null;

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="cuboid"
      position={position}
      onCollisionEnter={(event) => {
        const other = event.other;
        if (other.rigidBodyObject?.name === "train") {
          setCollected(true);
          if (onCollect) {
            onCollect(id);
          }
        }
      }}
    >
      <mesh castShadow>
        {/* <boxGeometry args={dimensions} />
        <meshStandardMaterial map={texture} /> */}
        <RailModel />
      </mesh>
    </RigidBody>
  );
}
function RailModel() {
  const railModel = useLoader(GLTFLoader, "/rail/scene.gltf");

  const model = useMemo(() => {
    const cloned = railModel.scene.clone(true);

    return cloned;
  }, [railModel]);

  return (
    <primitive
      object={model}
      scale={[0.25, 0.25, 0.25]}
      position={[0, 0, 0]}
      rotation={[0, Math.PI / 2, 0]}
    />
  );
}
export default React.memo(Rails);
