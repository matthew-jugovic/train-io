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
import Ground from "./components/Ground";
import Train from "./components/Train";
import CONSTANTS from "./constants/trainConstants";
import { Physics } from "@react-three/rapier";

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
          <Physics colliders="cuboid" /*debug */>
            {generatedPositions.map((pos, index) => (
              <Railcar
                key={`railcar-${pos[0]}-${pos[1]}-${pos[2]}-${index}`}
                position={pos}
                dimensions={[1.5, 1.5, 4]}
              />
            ))}
            <gridHelper args={[20]} />
            <Train />
            <Ground textureUrl={"/grassTexture.jpg"} />
            <ambientLight intensity={0.3} color="white" />
            <directionalLight
              castShadow
              position={[10, 10, 10]}
              intensity={1.5}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
