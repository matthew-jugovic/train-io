import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useState, Suspense } from "react";
import { DoubleSide, Mesh, RepeatWrapping, Vector3 } from "three";
import { OrbitControls, useTexture } from "@react-three/drei";
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
  vec3,
  type RigidBodyProps,
} from "@react-three/rapier";

function useKeyControls() {
  const [keys, setKeys] = useState({ w: false, a: false, d: false });
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
  const trainRef = useRef<RapierRigidBody>(null);
  const { w, a, d } = useKeyControls();
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (!trainRef.current) return;
    const speed = 400;
    const turnSpeed = 10;

    if (w) {
      // trainRef.current.translateZ(-speed * delta);
      //trainRef.current.applyImpulse({ x: 0, y: 0, z: -speed * delta }, true);
      const forward = new Vector3(0, 0, -1);
      forward.applyQuaternion(quat(trainRef.current.rotation()));
      forward.multiplyScalar(speed * delta);
      trainRef.current.applyImpulse(forward, true);
    }
    if (a) {
      // trainRef.current.rotation.y += turnSpeed;
      trainRef.current.applyTorqueImpulse({ x: 0, y: turnSpeed, z: 0 }, true);
      if (trainRef.current.angvel().y > turnSpeed) {
        trainRef.current.setAngvel({ x: 0, y: turnSpeed, z: 0 }, true)
      }
      
    }
    if (d) {
      // trainRef.current.rotation.y -= turnSpeed;
      trainRef.current.applyTorqueImpulse({ x: 0, y: -turnSpeed, z: 0 }, true);
      if (trainRef.current.angvel().y < -turnSpeed) {
        trainRef.current.setAngvel({ x: 0, y: -turnSpeed, z: 0 }, true)
      }

    }
    const trainPos = vec3(trainRef.current.translation());
    camera.position.set(trainPos.x + 5, trainPos.y + 30, trainPos.z);
    camera.lookAt(trainPos);
  });

  return (
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
