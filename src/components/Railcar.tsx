import type { FC } from "react";
import type { XYZ } from "../types/XYZ";
import { RigidBody } from "@react-three/rapier";

type RailcarProps = {
  position: XYZ;
  dimensions: XYZ;
  color?: string;
};

const Railcar: FC<RailcarProps> = ({ position, dimensions, color }) => {
  return (
    <RigidBody position={position}>
      <mesh position={position}>
        <boxGeometry args={dimensions} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
};

export default Railcar;
