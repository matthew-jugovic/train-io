import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useState, Suspense } from "react";
import { DoubleSide, RepeatWrapping, Vector3 } from "three";
import { useTexture } from "@react-three/drei";
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
      if (keys.hasOwnProperty(e.key))
        setKeys((k) => ({ ...k, [e.key]: false }));
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
  const blueCartRef = useRef<RapierRigidBody>(null);
  const redCartRef = useRef<RapierRigidBody>(null);

  const [isMoving, setIsMoving] = useState(false);

  const { w, a, s, d } = useKeyControls();
  const { camera } = useThree();

  const cartLength = 6; // fix
  const gap = 2;
  const spacing = cartLength + gap;

  useFrame((_, delta) => {
    if (!blueCartRef.current) return;

    if (w) {
      const forward = new Vector3(0, 0, -1);
      forward.applyQuaternion(quat(blueCartRef.current.rotation()));
      forward.multiplyScalar(CONSTANTS.speed * delta);
      blueCartRef.current.applyImpulse(forward, true);
    }
    if (a) {
      blueCartRef.current.applyTorqueImpulse(
        { x: 0, y: CONSTANTS.turn_speed, z: 0 },
        true
      );
      if (redCartRef.current) {
        redCartRef.current.applyTorqueImpulse(
          { x: 0, y: CONSTANTS.turn_speed, z: 0 },
          true
        );
      }
    }
    if (s) {
      blueCartRef.current.setLinvel(
        vec3(blueCartRef.current.linvel()).multiplyScalar(0.95),
        true
      );
    }
    if (d) {
      blueCartRef.current.applyTorqueImpulse(
        { x: 0, y: -CONSTANTS.turn_speed, z: 0 },
        true
      );
      if (redCartRef.current) {
        redCartRef.current.applyTorqueImpulse(
          { x: 0, y: -CONSTANTS.turn_speed, z: 0 },
          true
        );
      }
    }

    const velocity = blueCartRef.current.linvel();
    const speed = Math.sqrt(
      velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
    );
    const currentlyMoving = speed > 0.5 || w || a || s || d;
    if (currentlyMoving !== isMoving) {
      setIsMoving(currentlyMoving);
    }

    const blueCartPos = vec3(blueCartRef.current.translation());
    camera.position.set(blueCartPos.x + 5, blueCartPos.y + 30, blueCartPos.z);
    camera.lookAt(blueCartPos);
  });

  // Attach the red cart's back (with gap) to the blue cart's front
  useSphericalJoint(blueCartRef, redCartRef, [
    [0, 0.75, cartLength / 2], // front of blue cart (visual front)
    [0, 0.75, -cartLength / 2 - gap], // back of red cart, offset by gap
  ]);

  return (
    <>
      <group>
        {/* Blue cart (engine, controlled by "w") */}
        <RigidBody ref={blueCartRef} mass={10} position={[0, 0, 0]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[1.5, 1.5, cartLength]} />
            <meshStandardMaterial color="blue" />
          </mesh>
        </RigidBody>
        {/* Red cart, in front of blue cart, spaced by gap */}
        <RigidBody ref={redCartRef} mass={5} position={[0, 0, spacing]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[1.5, 1.5, cartLength]} />
            <meshStandardMaterial color="red" />
          </mesh>
        </RigidBody>
      </group>
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
  const { generatedPositions, generatePositions } =
    useRandomlyGeneratedPositions({
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
              <orthographicCamera
                attach="shadow-camera"
                args={[-5, 5, 5, -5]}
              />
            </directionalLight>
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
