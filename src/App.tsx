import { Canvas } from "@react-three/fiber";
import { useEffect, useState, Suspense, useRef } from "react";
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
import GameMap from "./components/GameMap";
import Rails from "./components/Rails";

const X_RANGE: Range = [-150, 150];
const Y_RANGE: Range = [1, 1];
const Z_RANGE: Range = [-150, 150];

function App() {
  const [coalCollected, setCoalCollected] = useState(0);
  const [railsCollected, setRailsCollected] = useState(0);

  const [username, setUsername] = useState("");
  const [chatMessage, setChatMessage] = useState("");

  const handleCoalCollected = () => {
    setCoalCollected((count) => count + 1);
  };

  const handleRailsCollected = () => {
    setRailsCollected((count) => count + 5);
  };

  // const { generatedPositions, generatePositions } =
  //   useRandomlyGeneratedPositions({
  //     numPositions: 100,
  //     xRange: X_RANGE,
  //     yRange: Y_RANGE,
  //     zRange: Z_RANGE,
  //   });
  const coalPositions = useRandomlyGeneratedPositions({
    numPositions: 500,
    xRange: X_RANGE,
    yRange: Y_RANGE,
    zRange: Z_RANGE,
  });
  const railsPositions = useRandomlyGeneratedPositions({
    numPositions: 10,
    xRange: X_RANGE,
    yRange: Y_RANGE,
    zRange: Z_RANGE,
  });

  // useEffect(() => {
  //   generatePositions();
  // }, [generatePositions]);

  useEffect(() => {
    coalPositions.generatePositions();
  }, [coalPositions.generatePositions]);

  useEffect(() => {
    railsPositions.generatePositions();
  }, [railsPositions.generatePositions]);

  useEffect(() => {
    const gui = new GUI();
    gui.add(CONSTANTS, "speed", 0, 10000, 1);
    gui.add(CONSTANTS, "turn_speed", 0, 100, 1);

    return () => {
      gui.destroy();
    };
  }, []);

  const hasVisited = useRef(false);
  useEffect(() => {
    if (!hasVisited.current) {
      hasVisited.current = true;
      const response_data = fetch("http://localhost:3000/visit", {
        method: "POST",
      })
        .then((res) => res.json())
        .then((data) => {
          const visitorCountElement = document.getElementById("visitor_count");
          if (visitorCountElement) {
            visitorCountElement.textContent = `Visitor Count: ${data.visit_count}`;
          }
        });
    }

    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onopen = () => {
      console.log("WebSocket connection opened.");
      const send_button_element = document.getElementById("public_chat_send");
      const chat_input_element = document.getElementById("public_chat_input");
      const username_input_element = document.getElementById("public_username");

      if (send_button_element && chat_input_element && username_input_element) {
        send_button_element.addEventListener("click", () => {
          const message = chat_input_element.value;
          const username = username_input_element.value || "Anonymous";
          if (message.trim() !== "") {
            ws.send(JSON.stringify({ username, message }));
            chat_input_element.value = ""; // Clear input after sending
          }
        });
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const chatLogElement = document.getElementById("public_chat_log");
      const visitorCountElement = document.getElementById("visitor_count");
      if (chatLogElement) {
        chatLogElement.textContent += `${data.username}: ${data.message}\n`;
      }
    };

    return () => {
      ws.close();
      console.log("WebSocket connection closed.");
    };
  }, []);

  return (
    <div id="canvas-container">
      <TrainProvider>
        <Canvas camera={{ position: [0, 18, 5] }} shadows>
          <Suspense>
            <Physics colliders="cuboid" debug={false}>
              {coalPositions.generatedPositions.map((pos, index) => (
                <Coal
                  key={`Coal-${pos[0]}-${pos[1]}-${pos[2]}-${index}`}
                  id={index}
                  position={pos}
                  dimensions={[1, 1, 1]}
                  onCollect={handleCoalCollected}
                />
              ))}
              {railsPositions.generatedPositions.map((pos, index) => (
                <Rails
                  key={`Rails-${pos[0]}-${pos[1]}-${pos[2]}-${index}`}
                  id={index}
                  position={pos}
                  // dimensions={[2.5, 2.5, 0.5]}
                  onCollect={handleRailsCollected}
                />
              ))}
              <Train />
              <GameMap />
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
        <UI coalCollected={coalCollected} railsCollected={railsCollected} />
      </TrainProvider>
      <div id="public_chat" className="overlay bg-white">
        <p id="visitor_count">...</p>
        <p id="public_chat_log"></p>
        <input
          id="public_username"
          type="text"
          placeholder="Enter your name..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          id="public_chat_input"
          type="textarea"
          placeholder="Type your message here..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
        />
        <button id="public_chat_send" className="bg-blue-300">
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
