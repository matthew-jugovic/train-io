import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useState, Suspense } from "react";
import { DoubleSide, Mesh, RepeatWrapping, Vector3 } from "three";
import { OrbitControls, useTexture } from "@react-three/drei";
import { GUI } from "lil-gui";
import {
  useRandomlyGeneratedPositions,
  type Range,
} from "./hooks/useRandomlyGeneratedPositions";
import Railcar from "./components/Railcar";
import {
  Physics,
  quat,
  RapierRigidBody,
  RigidBody,
  useSphericalJoint,
  vec3,
  type RigidBodyProps,
} from "@react-three/rapier";

// train sound :D
import TrainWhistleController from "./components/TrainWhistleController";

const CONSTANTS = {
  speed: 4000,
  turn_speed: 10,
  lerp_speed: 0.001,
};

function useKeyControls() {
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });
  useEffect(() => {
    function down(e: { key: PropertyKey }) {
      if (keys.hasOwnProperty(e.key)) setKeys((k) => ({ ...k, [e.key]: true }));
    }
    function up(e: { key: PropertyKey }) {
      if (keys.hasOwnProperty(e.key)) setKeys((k) => ({ ...k, [e.key]: false }));
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  return keys;
}

function Train() {
  const trainRef = useRef<RapierRigidBody>(null);
  const trainCartRef = useRef<RapierRigidBody>(null);

  const trainCartRef2 = useRef<RapierRigidBody>(null);
  const trainCartRef3 = useRef<RapierRigidBody>(null);
  const trainCartRef4 = useRef<RapierRigidBody>(null);

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
      trainRef.current.applyTorqueImpulse({ x: 0, y: CONSTANTS.turn_speed, z: 0 }, true);
      if (trainRef.current.angvel().y > CONSTANTS.turn_speed) {
        trainRef.current.setAngvel({ x: 0, y: CONSTANTS.turn_speed, z: 0 }, true);
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

    const newvel = vec3(trainRef.current.linvel()).lerp(forward, CONSTANTS.lerp_speed);
    trainRef.current.setLinvel(newvel, true);

    if (d) {
      trainRef.current.applyTorqueImpulse({ x: 0, y: -CONSTANTS.turn_speed, z: 0 }, true);
      if (trainRef.current.angvel().y < -CONSTANTS.turn_speed) {
        trainRef.current.setAngvel({ x: 0, y: -CONSTANTS.turn_speed, z: 0 }, true);
      }
    }

    // used to know when to play sound when moving or not
    const velocity = trainRef.current.linvel();
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
    const currentlyMoving = speed > 0.5 || w || a || s || d;
    if (currentlyMoving !== isMoving) {
      setIsMoving(currentlyMoving);
    }

    const trainPos = vec3(trainRef.current.translation());
    camera.position.set(trainPos.x + 5, trainPos.y + 30, trainPos.z);
    camera.lookAt(trainPos);
  });

  useSphericalJoint(trainRef, trainCartRef, [[0, 0.75, 3.5], [0, 0.75, -3.5]]);

  useSphericalJoint(trainCartRef, trainCartRef2, [[0, 0.75, 3.5], [0, 0.75, -3.5]]);

  useSphericalJoint(trainCartRef2, trainCartRef3, [[0, 0.75, 3.5], [0, 0.75, -3.5]]);
  useSphericalJoint(trainCartRef3, trainCartRef4, [[0, 0.75, 3.5], [0, 0.75, -3.5]]);

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
          ref={trainCartRef2}
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
          ref={trainCartRef3}
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
          ref={trainCartRef4}
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
        >
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[1.5, 1.5, 5]} />
            <meshStandardMaterial color="blue" />
          </mesh>
        </RigidBody>
      </group>

      {/*THE WHISTLE CONTROLLER  */}
      <TrainWhistleController moving={isMoving} />
    </>
  );
}

function Ground() {
  const texture = useTexture("/grassTexture.jpg");
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.needsUpdate = true;

  return (
    <RigidBody type="fixed">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="white" side={DoubleSide} map={texture} />
      </mesh>
    </RigidBody>
  );
}

const X_RANGE: Range = [-250, 250];
const Y_RANGE: Range = [1, 1];
const Z_RANGE: Range = [-250, 250];

function App() {
  const { generatedPositions, generatePositions } = useRandomlyGeneratedPositions({
    numPositions: 1000,
    xRange: X_RANGE,
    yRange: Y_RANGE,
    zRange: Z_RANGE,
  });

  useEffect(() => {
    generatePositions();
  }, [generatePositions]);

  useEffect(() => {
    const gui = new GUI();
    gui.add(CONSTANTS, "speed", 0, 10000, 1);
    gui.add(CONSTANTS, "turn_speed", 0, 100, 1);
    gui.add(CONSTANTS, "lerp_speed", 0, 0.1, 0.00001);

    return () => {
      gui.destroy();
    };
  }, []);

  return (
    <div id="canvas-container">
      <Canvas camera={{ position: [0, 18, 5] }} shadows>
        <Suspense>
          <Physics colliders="cuboid" debug>
            {generatedPositions.map((pos, index) => (
              <Railcar
                key={`railcar-${pos[0]}-${pos[1]}-${pos[2]}-${index}`}
                position={pos}
                dimensions={[1.5, 1.5, 4]}
              />
            ))}
            <gridHelper args={[20]} />
            <Train />
            <Ground />
            <ambientLight intensity={0.2} color="white" />
            <directionalLight position={[2, 2, 1]}>
              <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5]} />
            </directionalLight>
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
