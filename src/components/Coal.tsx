import { RigidBody } from "@react-three/rapier";
import { useState } from "react";
import type { XYZ } from "../types/XYZ";
import React from "react";

type CoalProps = {
  id: number;
  position: XYZ;
  dimensions: [number, number, number];
  onCollect: (id: number) => void;
};

function Coal({ id, position, dimensions, onCollect }: CoalProps) {
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
        <meshStandardMaterial color="black" />
      </mesh>
    </RigidBody>
  );
}
export default React.memo(Coal);
