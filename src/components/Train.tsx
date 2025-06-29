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
  const trainCartRef = useRef<RapierRigidBody>(null);

  // added state to create sound when train is moving:
  const [isMoving, setIsMoving] = useState(false);
  const { w, a, s, d } = useKeyControls();
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (!trainRef.current) return;
    if (w) {
      const forward = new Vector3(0, 0, -1);
      forward.applyQuaternion(quat(trainRef.current.rotation()));
      forward.multiplyScalar(CONSTANTS.speed * delta);
      trainRef.current.applyImpulse(forward, true);

      const magCurrentSpeed = Math.sqrt(
        trainRef.current.linvel().x ** 2 +
          trainRef.current.linvel().y ** 2 +
          trainRef.current.linvel().z ** 2
      );
      const magForwardMaxSpeed = Math.sqrt(
        forward.x ** 2 + forward.y ** 2 + forward.z ** 2
      );

      console.log(
        `my speed of my car is ${magCurrentSpeed}\nmy max speed is ${magForwardMaxSpeed}`
      );

      if (magCurrentSpeed > magForwardMaxSpeed) {
        trainRef.current.setLinvel(forward, true);
      }
    }
    if (a) {
      trainRef.current.applyTorqueImpulse(
        { x: 0, y: CONSTANTS.turn_speed, z: 0 },
        true
      );
      if (trainRef.current.angvel().y > CONSTANTS.turn_speed) {
        trainRef.current.setAngvel(
          { x: 0, y: CONSTANTS.turn_speed, z: 0 },
          true
        );
      }
    }
    if (d) {
      trainRef.current.applyTorqueImpulse(
        { x: 0, y: -CONSTANTS.turn_speed, z: 0 },
        true
      );
      if (trainRef.current.angvel().y < -CONSTANTS.turn_speed) {
        trainRef.current.setAngvel(
          { x: 0, y: -CONSTANTS.turn_speed, z: 0 },
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

    // Move forward based on train current rotation.
    const forward = new Vector3(0, 0, -1);
    forward.applyQuaternion(quat(trainRef.current.rotation()));
    forward.multiplyScalar(CONSTANTS.speed * delta);

    const newvel = vec3(trainRef.current.linvel()).lerp(
      forward,
      CONSTANTS.lerp_speed
    );
    trainRef.current.setLinvel(newvel, true);

    // lock rotation to stop train flipping
    trainRef.current.setAngvel(
      { x: 0, y: trainRef.current.angvel().y, z: 0 },
      true
    );
    // used to know when to play sound when moving or not
    const velocity = trainRef.current.linvel();
    const speed = Math.sqrt(
      velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
    );
    const currentlyMoving = speed > 0.5 || w || a || s || d;
    if (currentlyMoving !== isMoving) {
      setIsMoving(currentlyMoving);
    }

    const trainPos = vec3(trainRef.current.translation());
    camera.position.set(trainPos.x + 15, trainPos.y + 30, trainPos.z);
    camera.lookAt(trainPos);
  });

  useSphericalJoint(trainRef, trainCartRef, [
    [0, 0.75, 3.5],
    [0, 0.75, -3.5],
  ]);

  return (
    <>
      <group>
        <RigidBody
          ref={trainCartRef}
          onCollisionEnter={() => {
            console.log("Collision");
          }}
        >
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[1.5, 1.5, 5]} />
            <meshStandardMaterial color="blue" />
          </mesh>
        </RigidBody>

        <RigidBody
          ref={trainRef}
          onCollisionEnter={() => {
            console.log("Collision");
          }}
          colliders="hull"
        >
          <TrainModel />
        </RigidBody>
      </group>

      {/*THE WHISTLE CONTROLLER  */}
      <TrainWhistleController moving={isMoving} />
    </>
  );
}
export default Train;
