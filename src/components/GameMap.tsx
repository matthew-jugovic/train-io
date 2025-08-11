import { useGLTF } from "@react-three/drei";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useMemo, useRef, type JSX } from "react";
import { Euler, Object3D, Quaternion, Vector3 } from "three";
import Station from "./Station";

export default function GameMap() {
  const { scene } = useGLTF("/map.glb");

  const { trees, stations } = useMemo(() => {
    const trees: JSX.Element[] = [];
    const stations: JSX.Element[] = [];

    scene.traverse((child) => {
      if (child.name.startsWith("Tree")) {
        trees.push(<Tree key={child.uuid} treeMesh={child} />);
      }

      if (child.name.startsWith("Station")) {
        stations.push(<Station key={child.uuid} stationMesh={child} />);
      }
    });

    return { trees, stations };
  }, [scene]);

  return (
    <>
      <RigidBody type="fixed" colliders="hull">
        <primitive object={scene} position={[0, 0, 0]} />
      </RigidBody>

      {trees}
      {stations}
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
