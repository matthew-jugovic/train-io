import { quat, RapierRigidBody, RigidBody, vec3 } from "@react-three/rapier";
import TrainWhistleController from "./TrainWhistleController";
import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useContext, useEffect, useRef, useState } from "react";
import useKeyControls from "../hooks/useKeyControls";
import CONSTANTS from "../constants/trainConstants";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { TrainContext } from "../contexts/trainContext";

function TrainModel() {
  const trainModel = useLoader(GLTFLoader, "/train/train.gltf");
  return (
    <primitive
      object={trainModel.scene}
      scale={0.008}
      position={[0, -1, 0]}
      rotation={[0, Math.PI, 0]}
    />
  );
}

function Train() {
  const trainManager = useContext(TrainContext);
  const trainRef = useRef<RapierRigidBody>(null);

  const [isMoving, setIsMoving] = useState(false);

  const { w, a, s, d } = useKeyControls();
  const { camera } = useThree();

  useEffect(() => {
    if (!trainManager || !trainRef.current) return;
    trainManager.addTrainRef("0", trainRef as React.RefObject<RapierRigidBody>);
    return () => {
      trainManager.removeTrainRef("0");
    };
  }, [trainManager, trainRef]);

  useFrame((_, delta) => {
    if (!trainRef.current) return;
    if (!trainManager || !trainRef.current) return;
    const bonusSpeed = (trainManager.carCount - 1) * 1000;
    const bonusTurn = (trainManager.carCount - 1) * 5;
    if (w) {
      const forward = new Vector3(0, 0, -1);
      forward.applyQuaternion(quat(trainRef.current.rotation()));
      forward.multiplyScalar((CONSTANTS.speed + bonusSpeed) * delta);
      trainRef.current.applyImpulse(forward, true);
    }
    if (a) {
      trainRef.current.applyTorqueImpulse(
        { x: 0, y: CONSTANTS.turn_speed + bonusTurn, z: 0 },
        true
      );
      // if (redCartRef.current) {
      //   redCartRef.current.applyTorqueImpulse(
      //     { x: 0, y: CONSTANTS.turn_speed, z: 0 },
      //     true
      //   );
      // }
      // if (greenCartRef.current) {
      //   greenCartRef.current.applyTorqueImpulse(
      //     { x: 0, y: CONSTANTS.turn_speed, z: 0 },
      //     true
      //   );
      // }
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
      // if (redCartRef.current) {
      //   redCartRef.current.applyTorqueImpulse(
      //     { x: 0, y: -CONSTANTS.turn_speed, z: 0 },
      //     true
      //   );
      // }
      // if (greenCartRef.current) {
      //   greenCartRef.current.applyTorqueImpulse(
      //     { x: 0, y: -CONSTANTS.turn_speed, z: 0 },
      //     true
      //   );
      // }
    }

    const velocity = trainRef.current.linvel();
    const speed = Math.sqrt(
      velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
    );
    const currentlyMoving = speed > 0.5 || w || a || s || d;
    if (currentlyMoving !== isMoving) {
      setIsMoving(currentlyMoving);
    }

    if (!trainRef.current || !trainManager) return;
    const blueCartPos = vec3(trainRef.current.translation());
    camera.position.set(
      blueCartPos.x + 15 + trainManager.carCount * 2,
      blueCartPos.y + 20 + trainManager.carCount * 4,
      blueCartPos.z
    );
    camera.lookAt(blueCartPos);
  });
  // // Attach the red cart's back (with gap) to the blue cart's front
  // useSphericalJoint(trainRef, redCartRef, [
  //   [0, 0.75, cartLength / 2], // front of blue cart
  //   [0, 0.75, -cartLength / 2 - gap], // back of red cart, offset by gap
  // ]);
  // // Attach the green cart's back (with gap) to the red cart's front
  // useSphericalJoint(redCartRef, greenCartRef, [
  //   [0, 0.75, cartLength / 2], // front of red cart
  //   [0, 0.75, -cartLength / 2 - gap], // back of green cart, offset by gap
  // ]);

  return (
    <>
      <group>
        {/* Train (engine) */}
        <RigidBody
          enabledRotations={[false, true, false]}
          name="train"
          position={[0, 1, 0]}
          linearDamping={1}
          ref={trainRef}
          onCollisionEnter={() => {
            console.log("Collision");
          }}
          colliders="hull"
        >
          <TrainModel />
        </RigidBody>
        {trainManager?.trainCars}
        {trainManager?.joints}
      </group>
      <TrainWhistleController moving={isMoving} />
    </>
  );
}
export default Train;
