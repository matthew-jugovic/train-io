import { Canvas } from "@react-three/fiber";
import { useEffect, useState, Suspense } from "react";
import { GUI } from "lil-gui";
import {
  useRandomlyGeneratedPositions,
  type Range,
} from "./hooks/useRandomlyGeneratedPositions";
import Ground from "./components/Ground";
import Train from "./components/Train";
import CONSTANTS from "./constants/trainConstants";
import { Physics } from "@react-three/rapier";
import UI from "./components/UI";
import Coal from "./components/Coal";
import { TrainProvider } from "./contexts/trainContext";
import StaticRailcar from "./components/StaticRailcar";

const X_RANGE: Range = [-250, 250];
const Y_RANGE: Range = [1, 1];
const Z_RANGE: Range = [-250, 250];

function App() {
  const [coalCollected, setCoalCollected] = useState(0);

  const handleCoalCollected = () => {
    setCoalCollected((count) => count + 1);
  };

  const { generatedPositions, generatePositions } =
    useRandomlyGeneratedPositions({
      numPositions: 100,
      xRange: X_RANGE,
      yRange: Y_RANGE,
      zRange: Z_RANGE,
    });
  const coalPositions = useRandomlyGeneratedPositions({
    numPositions: 500,
    xRange: X_RANGE,
    yRange: Y_RANGE,
    zRange: Z_RANGE,
  });

  useEffect(() => {
    generatePositions();
  }, [generatePositions]);

  useEffect(() => {
    coalPositions.generatePositions();
  }, [coalPositions.generatePositions]);

  useEffect(() => {
    const gui = new GUI();
    gui.add(CONSTANTS, "speed", 0, 10000, 1);
    gui.add(CONSTANTS, "turn_speed", 0, 100, 1);

    return () => {
      gui.destroy();
    };
  }, []);

  return (
    <div id="canvas-container">
      <TrainProvider>
        <Canvas camera={{ position: [0, 18, 5] }} shadows>
          <Suspense>
            <Physics colliders="cuboid" debug={false}>
              {generatedPositions.map((pos, index) => (
                <StaticRailcar
                  key={`railcar-${pos[0]}-${pos[1]}-${pos[2]}-${index}`}
                  position={pos}
                />
              ))}
              {coalPositions.generatedPositions.map((pos, index) => (
                <Coal
                  key={`Coal-${pos[0]}-${pos[1]}-${pos[2]}-${index}`}
                  id={index}
                  position={pos}
                  dimensions={[1, 1, 1]}
                  onCollect={handleCoalCollected}
                />
              ))}
              <Train />
              <Ground textureUrl={"/grassTexture.jpg"} />
              <ambientLight intensity={0.3} color="white" />
              <directionalLight
                castShadow
                position={[10, 10, 10]}
                intensity={2}
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
            </Physics>
          </Suspense>
        </Canvas>
        <UI coalCollected={coalCollected} />
      </TrainProvider>
    </div>
  );
}

export default App;
