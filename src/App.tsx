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

const X_RANGE: Range = [-250, 250];
const Y_RANGE: Range = [1, 1];
const Z_RANGE: Range = [-250, 250];

function App() {
  const [coalCollected, setCoalCollected] = useState(0);

  const [username, setUsername] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [messages, setMessages] = useState<string[]>([]);


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
  }, []);

  useEffect(() => {
    const gui = new GUI();
    gui.add(CONSTANTS, "speed", 0, 10000, 1);
    gui.add(CONSTANTS, "turn_speed", 0, 100, 1);

    return () => {
      gui.destroy();
    };
  }, []);


  const hasVisited = useRef(false)
  useEffect(() => {
    if (!hasVisited.current) {

      hasVisited.current = true
      fetch("http://localhost:3000/visit", {
        method: "POST",
      })
        .then(res => res.json())
        .then(data => {
          setVisitorCount(data.visit_count);
        })
      
      // Load last five messages into React state (don’t mutate the DOM).
      fetch("http://localhost:3000/public_chat_log")
        .then(res => res.json())
        .then((data: { username: string; message: string }[]) => {
          console.log("Fetched chat log:", data);
          setMessages(data.map((msg) => `${msg.username}: ${msg.message}`));
        })
        .catch(err => {
          console.error("Error fetching chat log:", err);
        });
    }

    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onopen = () => {
      console.log("WebSocket connection opened.");
      const send_button_element = document.getElementById("public_chat_send")
      const chat_input_element = document.getElementById("public_chat_input");
      const username_input_element = document.getElementById("public_username");

      if (send_button_element && chat_input_element && username_input_element) {

        function send_chat_message() {
          const message = (chat_input_element as HTMLInputElement).value;

          if (message.trim() === "") {
            return;
          }

          ws.send(JSON.stringify({
            type: "public_message",
            data: {
              username: username,
              message: message
            }
          }));
          
          setChatMessage("");
        }

        send_button_element.addEventListener("click", () => {
          send_chat_message()
        });

        addEventListener("keydown", (e) => {

          if (e.code === "Enter") {
            send_chat_message()
          }
        })
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "public_message") {
        const message = `${data.data.username}: ${data.data.message}`;
        setMessages(prev => [...prev, message]);
      }
    }




    return () => {
      ws.close()
      console.log("WebSocket connection closed.");
    }
  }, []);

  return (
    <div className="relative w-screen h-screen">
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
        <UI coalCollected={coalCollected} />
      </TrainProvider>
      <div
        id="public_chat"
        className="absolute bottom-5 right-5 z-10 w-[360px] h-[260px] rounded-lg p-3 text-white
                   bg-gradient-to-t from-gray-900/70 to-gray-900/20 backdrop-blur-sm shadow-lg
                   flex flex-col"
      >
        <p id="visitor_count">
          {visitorCount !== null ? `Visitor Count: ${visitorCount}` : "..."}
        </p>

        {/* Messages fill from bottom upward */}
        <div className="mt-2 h-40 overflow-y-auto flex flex-col justify-end space-y-1">
          {messages.map((m, i) => (
            <p key={i} className="whitespace-pre-wrap text-sm">{m}</p>
          ))}
        </div>

        <input
          id="public_username"
          type="text"
          placeholder="Enter your name..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-2 w-full rounded bg-white/10 border border-white/20 px-2 py-1 placeholder-white/60"
        />
        <div className="mt-2 flex gap-2">
          <input
            id="public_chat_input"
            type="text"
            placeholder="Type your message here..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            className="flex-1 rounded bg-white/10 border border-white/20 px-2 py-1 placeholder-white/60"
          />
          <button id="public_chat_send" className="rounded bg-blue-500/80 hover:bg-blue-500 px-3 text-white">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default App;
