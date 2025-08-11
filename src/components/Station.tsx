import React, { useContext, useEffect, useRef, useState } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { Euler, Object3D, Quaternion, Vector3 } from "three";
import { PassengerContext } from "../contexts/passengerContext";

type StationProps = {
  stationMesh: Object3D;
};

export default function Station({ stationMesh }: StationProps) {
  const passengerManager = useContext(PassengerContext);
  if (!passengerManager) return null;
  const { passengers, maxPassengers, addPassengers } = passengerManager;
  const zoneRef = useRef<RapierRigidBody>(null);
  const [insideZone, setInsideZone] = useState(false);

  const forwardOffset = new Vector3(0, 0, -10);
  const stationPos = new Vector3();
  const stationQuat = new Quaternion();

  stationMesh.getWorldPosition(stationPos);
  stationMesh.getWorldQuaternion(stationQuat);

  const worldOffset = forwardOffset.clone().applyQuaternion(stationQuat);
  const zonePos = stationPos.clone().add(worldOffset);
  const zoneRot = new Euler().setFromQuaternion(stationQuat);

  useEffect(() => {
    if (!insideZone) return;

    const interval = setInterval(() => {
      if (passengers < maxPassengers) {
        addPassengers(1);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [insideZone, passengers, maxPassengers, addPassengers]);

  return (
    <>
      <RigidBody colliders="hull" type="fixed">
        <primitive object={stationMesh} />
      </RigidBody>
      <RigidBody
        ref={zoneRef}
        type="fixed"
        colliders="cuboid"
        sensor
        onIntersectionEnter={(e) => {
          const other = e.other;

          if (other.rigidBodyObject?.name === "train") {
            console.log("Train entered station zone:", stationMesh.name);
            setInsideZone(true);
          }
        }}
        onIntersectionExit={(e) => {
          const other = e.other;

          if (other.rigidBodyObject?.name === "train") {
            console.log("Train left station zone:", stationMesh.name);
            setInsideZone(false);
          }
        }}
      >
        <mesh position={zonePos} rotation={zoneRot}>
          <boxGeometry args={[12, 4, 5]} />
          <meshBasicMaterial color="yellow" transparent opacity={0.2} />
        </mesh>
      </RigidBody>
    </>
  );
}
