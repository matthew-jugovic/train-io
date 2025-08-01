import { useGLTF } from "@react-three/drei";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useMemo, useRef, type JSX } from "react";
import { Object3D } from "three";

export default function GameMap() {
  const { scene } = useGLTF("/map.glb");

  const dynamicTrees = useMemo(() => {
    const trees: JSX.Element[] = [];

    scene.traverse((child) => {
      if (child.name.startsWith("Tree")) {
        trees.push(<Tree treeMesh={child} />);
      }
    });
    return trees;
  }, [scene]);

  return (
    <>
      <RigidBody type="fixed" colliders="hull">
        <primitive object={scene} />
      </RigidBody>
      {dynamicTrees}
    </>
  );
}

function Tree({ treeMesh }: { treeMesh: Object3D }) {
  const ref = useRef<RapierRigidBody>(null);

  return (
    <RigidBody
      ref={ref}
      type="kinematicPosition"
      colliders="hull"
      density={0.1}
      onCollisionEnter={() => {
        ref.current?.setBodyType("dynamic" as any, true);
        ref.current?.wakeUp();
      }}
    >
      <primitive object={treeMesh} />
    </RigidBody>
  );
}
