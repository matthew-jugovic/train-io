import { RigidBody } from "@react-three/rapier";
import { useContext, useState } from "react";
import type { XYZ } from "../types/XYZ";
import React from "react";
import { CollectibleContext } from "../contexts/collectibleContext";

type CoalProps = {
  id: number;
  position: XYZ;
  dimensions: [number, number, number];
};

function Coal({ id, position, dimensions }: CoalProps) {
  const [collected, setCollected] = useState(false);
  const collectibleManager = useContext(CollectibleContext);
  if (!collectibleManager) return null;
  const { coalNum, maxCoal, addCoal } = collectibleManager;

  if (collected) return null;

  return (
    <RigidBody
      key={id}
      colliders="cuboid"
      position={position}
      onCollisionEnter={(event) => {
        const other = event.other;
        if (other.rigidBodyObject?.name === "train") {
          if (coalNum < maxCoal) {
            setCollected(true);
            addCoal(1); // increment by 1 coal per pick-up
          }
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
