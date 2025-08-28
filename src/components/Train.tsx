import {
  CuboidCollider,
  quat,
  RapierRigidBody,
  RigidBody,
  vec3,
} from "@react-three/rapier";
import TrainWhistleController from "./TrainWhistleController";
import { Euler, Vector3, Quaternion } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useContext, useEffect, useRef, useState } from "react";
import { useKeyControls } from "../hooks/useKeyControls";
import CONSTANTS from "../constants/trainConstants";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { TrainContext } from "../contexts/trainContext";
import { CollectibleContext } from "../contexts/collectibleContext";

function TrainModel() {
  const trainModel = useLoader(GLTFLoader, "/train/train.gltf");
  return (
    <primitive
      object={trainModel.scene}
      scale={[0.0085, 0.0085, 0.0087]}
      position={[0, -1, 0]}
      rotation={[0, Math.PI, 0]}
    />
  );
}

function clampRotation(body: RapierRigidBody, maxRollDegrees = 10) {
  const rot = body.rotation();
  const q = new Quaternion(rot.x, rot.y, rot.z, rot.w);

  const euler = new Euler().setFromQuaternion(q, "YXZ");

  const maxRoll = (maxRollDegrees * Math.PI) / 180;
  euler.z = Math.max(-maxRoll, Math.min(maxRoll, euler.z));

  const clampedQuat = new Quaternion().setFromEuler(euler);

  body.setRotation(
    {
      x: clampedQuat.x,
      y: clampedQuat.y,
      z: clampedQuat.z,
      w: clampedQuat.w,
    },
    true
  );
}

function Train() {
  const trainManager = useContext(TrainContext);
  const collectibleManager = useContext(CollectibleContext);
  if (!collectibleManager) return null;
  const trainRef = useRef<RapierRigidBody>(null);
  const [isMoving, setIsMoving] = useState(false);

  const keys = useKeyControls();
  const { camera } = useThree();

  useEffect(() => {
    if (!trainManager || !trainRef.current) return;
    trainManager.addTrainRef("0", trainRef as React.RefObject<RapierRigidBody>);
    return () => {
      trainManager.removeTrainRef("0");
    };
  }, []);

  useFrame((_, delta) => {
    const { w, a, s, d, space } = keys.current;
    if (!trainRef.current || !trainManager) return;

    const bonusSpeed = (trainManager.carCount - 1) * 1200;
    const bonusTurn = (trainManager.carCount - 1) * 7;

    if (w) {
      let speedMultiplier = 1.0;

      if (space) {
        const usedCoal = collectibleManager.consumeCoal(1 * delta);
        if (usedCoal) {
          speedMultiplier = 1.5;
        }
      }

      const forward = new Vector3(0, 0, -1);
      forward.applyQuaternion(quat(trainRef.current.rotation()));
      forward.multiplyScalar(
        (CONSTANTS.speed + bonusSpeed) * speedMultiplier * delta
      );

      trainRef.current.applyImpulse(forward, true);
    }

    if (a) {
      trainRef.current.applyTorqueImpulse(
        { x: 0, y: CONSTANTS.turn_speed + bonusTurn, z: 0 },
        true
      );
    }
    if (s) {
      trainRef.current.setLinvel(
        vec3(trainRef.current.linvel()).multiplyScalar(0.95),
        true
      );
    }
    if (d) {
      trainRef.current.applyTorqueImpulse(
        { x: 0, y: -(CONSTANTS.turn_speed + bonusTurn), z: 0 },
        true
      );
    }

    const velocity = trainRef.current.linvel();
    const speed = Math.sqrt(
      velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
    );
    const currentlyMoving = speed > 0.5 || w || a || s || d;
    if (currentlyMoving !== isMoving) {
      setIsMoving(currentlyMoving);
    }

    // Clamp rotation
    clampRotation(trainRef.current, 20);
    trainManager.trainRefs.forEach((ref: { current: RapierRigidBody }) => {
      if (ref.current) clampRotation(ref.current, 10);
    });

    // Camera follow
    const trainPos = vec3(trainRef.current.translation());
    camera.position.set(
      trainPos.x + 15 + trainManager.carCount * 2,
      trainPos.y + 25 + trainManager.carCount * 4,
      trainPos.z
    );
    camera.lookAt(trainPos);
  });

  return (
    <>
      <group>
        {/* Train (engine) */}
        <RigidBody
          name="train"
          colliders={false}
          position={[0, 2, 0]}
          ref={trainRef}
          linearDamping={1.5}
          angularDamping={0}
        >
          <CuboidCollider args={[1.5, 1.5, 3.5]} position={[0, 0.5, 0]} />

          <TrainModel />
        </RigidBody>
        {trainManager?.trainCars.map((car) => car.railcar)}
        {trainManager?.joints}
      </group>
      <TrainWhistleController moving={isMoving} />
    </>
  );
}
export default Train;
