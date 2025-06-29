import {
  quat,
  RapierRigidBody,
  RigidBody,
  useSphericalJoint,
  vec3,
} from "@react-three/rapier";
import TrainWhistleController from "./TrainWhistleController";
import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import useKeyControls from "../hooks/useKeyControls";
import CONSTANTS from "../constants/trainConstants";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

function TrainModel() {
  const trainModel = useLoader(GLTFLoader, "/train/train.gltf");
  return (
    <primitive
      object={trainModel.scene}
      scale={0.008}
      position={[0, 0, 0]}
      rotation={[0, Math.PI, 0]}
    />
  );
}

function Train() {
  const trainRef = useRef<RapierRigidBody>(null);
  const redCartRef = useRef<RapierRigidBody>(null);
  const greenCartRef = useRef<RapierRigidBody>(null); // New cart

  const [isMoving, setIsMoving] = useState(false);

  const { w, a, s, d } = useKeyControls();
  const { camera } = useThree();

  const cartLength = 6;
  const gap = 2;
  const spacing = cartLength + gap;
  useFrame((_, delta) => {
    if (!trainRef.current) return;

    if (w) {
      const forward = new Vector3(0, 0, -1);
      forward.applyQuaternion(quat(trainRef.current.rotation()));
      forward.multiplyScalar(CONSTANTS.speed * delta);
      trainRef.current.applyImpulse(forward, true);
    }
    if (a) {
      trainRef.current.applyTorqueImpulse(
        { x: 0, y: CONSTANTS.turn_speed, z: 0 },
        true
      );
      if (redCartRef.current) {
        redCartRef.current.applyTorqueImpulse(
          { x: 0, y: CONSTANTS.turn_speed, z: 0 },
          true
        );
      }
      if (greenCartRef.current) {
        greenCartRef.current.applyTorqueImpulse(
          { x: 0, y: CONSTANTS.turn_speed, z: 0 },
          true
        );
      }
    }
    if (s) {
      trainRef.current.setLinvel(
        vec3(trainRef.current.linvel()).multiplyScalar(0.95),
        true
      );
    }
    if (d) {
      trainRef.current.applyTorqueImpulse(
        { x: 0, y: -CONSTANTS.turn_speed, z: 0 },
        true
      );
      if (redCartRef.current) {
        redCartRef.current.applyTorqueImpulse(
          { x: 0, y: -CONSTANTS.turn_speed, z: 0 },
          true
        );
      }
      if (greenCartRef.current) {
        greenCartRef.current.applyTorqueImpulse(
          { x: 0, y: -CONSTANTS.turn_speed, z: 0 },
          true
        );
      }
    }

    // lock rotation to stop train flipping
    trainRef.current.setAngvel(
      { x: 0, y: trainRef.current.angvel().y, z: 0 },
      true
    );

    const velocity = trainRef.current.linvel();
    const speed = Math.sqrt(
      velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
    );
    const currentlyMoving = speed > 0.5 || w || a || s || d;
    if (currentlyMoving !== isMoving) {
      setIsMoving(currentlyMoving);
    }

    const blueCartPos = vec3(trainRef.current.translation());
    camera.position.set(blueCartPos.x + 15, blueCartPos.y + 30, blueCartPos.z);
    camera.lookAt(blueCartPos);
  });

  // Attach the red cart's back (with gap) to the blue cart's front
  useSphericalJoint(trainRef, redCartRef, [
    [0, 0.75, cartLength / 2], // front of blue cart
    [0, 0.75, -cartLength / 2 - gap], // back of red cart, offset by gap
  ]);
  // Attach the green cart's back (with gap) to the red cart's front
  useSphericalJoint(redCartRef, greenCartRef, [
    [0, 0.75, cartLength / 2], // front of red cart
    [0, 0.75, -cartLength / 2 - gap], // back of green cart, offset by gap
  ]);

  return (
    <>
      <group>
        {/* Train (engine) */}
        <RigidBody
          linearDamping={1}
          ref={trainRef}
          onCollisionEnter={() => {
            console.log("Collision");
          }}
          colliders="hull"
        >
          <TrainModel />
        </RigidBody>
        {/* Red cart, in front of blue cart */}
        <RigidBody
          ref={redCartRef}
          mass={5}
          position={[0, 0, spacing]}
          linearDamping={1}
        >
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[1.5, 1.5, cartLength]} />
            <meshStandardMaterial color="red" />
          </mesh>
        </RigidBody>
        {/* Green cart, in front of red cart */}
        <RigidBody
          ref={greenCartRef}
          mass={5}
          position={[0, 0, spacing * 2]}
          linearDamping={1}
        >
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[1.5, 1.5, cartLength]} />
            <meshStandardMaterial color="green" />
          </mesh>
        </RigidBody>
      </group>
      <TrainWhistleController moving={isMoving} />
    </>
  );
}
export default Train;
