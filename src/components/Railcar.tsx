import type { FC, Ref } from "react";
import type { XYZ } from "../types/XYZ";
import { RigidBody, type RigidBodyProps } from "@react-three/rapier";
import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Mesh } from "three";

type RailcarProps = {
  position: XYZ;
  color?: string;
  refProp?: Ref<any>;
} & Partial<RigidBodyProps>;

const Railcar: FC<RailcarProps> = ({
  position,
  color,
  refProp,
  ...rigidBodyProps
}) => {
  const trainModel = useLoader(GLTFLoader, "/coalCar/coalCar.gltf");

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
      ref={refProp}
      mass={1}
      position={position}
      {...rigidBodyProps}
    >
      {model}
    </RigidBody>
  );
};
export default Railcar;
