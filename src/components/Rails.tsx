import { RigidBody } from "@react-three/rapier";
import { useState } from "react";
import type { XYZ } from "../types/XYZ";
import React from "react";

type RailProps = {
  id: number;
  position: XYZ;
  dimensions: [number, number, number];
  onCollect: (id: number) => void;
};

function Rails({ id, position, dimensions, onCollect }: RailProps) {
  const [collected, setCollected] = useState(false);

  if (collected) return null;

  return (
    <RigidBody
      colliders="cuboid"
      position={position}
      onCollisionEnter={(event) => {
        const other = event.other;

        if (other.rigidBodyObject?.name === "train") {
          setCollected(true);
          onCollect(id);
        }
      }}
    >
      <mesh castShadow>
        <boxGeometry args={dimensions} />
        <meshStandardMaterial color="brown" />
      </mesh>
    </RigidBody>
  );
}
export default React.memo(Rails);
