import { Canvas } from "@react-three/fiber";
import { useEffect, useState, Suspense, useRef } from "react";
import { GUI } from "lil-gui";
import {
  useRandomlyGeneratedPositions,
  type Range,
} from "./hooks/useRandomlyGeneratedPositions";
import Train from "./components/Train";
import CONSTANTS from "./constants/trainConstants";
import { Physics } from "@react-three/rapier";
import UI from "./components/UI";
import Coal from "./components/Coal";
import { TrainProvider } from "./contexts/trainContext";
import GameMap from "./components/GameMap";
import Rails from "./components/Rails";
import { PassengerProvider } from "./contexts/passengerContext";
import { type DataObject } from "./client_server_share/Interfaces.tsx";
import { CollectibleProvider } from "./contexts/collectibleContext";

const X_RANGE: Range = [-370, 370];
const Y_RANGE: Range = [1, 1];
const Z_RANGE: Range = [-370, 370];

function App() {
  const [railsCollected, setRailsCollected] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const [username, setUsername] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [playersConnected, setPlayersConnected] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const inFlightPingStartedAtRef = useRef<number | null>(null);

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

  // useEffect(() => {
  //   const gui = new GUI();
  //   gui.add(CONSTANTS, "speed", 0, 10000, 1);
  //   gui.add(CONSTANTS, "turn_speed", 0, 100, 1);

  //   return () => {
  //     gui.destroy();
  //   };
  // }, []);

  // useEffect(() => {
  //   const gui = new GUI();
  //   gui.add(CONSTANTS, "speed", 0, 10000, 1);
  //   gui.add(CONSTANTS, "turn_speed", 0, 100, 1);

  //   return () => {
  //     gui.destroy();
  //   };
  // }, []);

  const hasVisited = useRef(false);
  useEffect(() => {
    if (!hasVisited.current) {
      hasVisited.current = true;
      fetch("http://localhost:3000/visit", {
        method: "POST",
      })
        .then((res) => res.json())
        .then((data) => {
          setVisitorCount(data.visit_count);
        });

      // Load last five messages into React state
      fetch("http://localhost:3000/public_chat_log")
        .then((res) => res.json())
        .then((data: { username: string; message: string }[]) => {
          console.log("Fetched chat log:", data);
          setMessages(data.map((msg) => `${msg.username}: ${msg.message}`));
        })
        .catch((err) => {
          console.error("Error fetching chat log:", err);
        });
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (pingIntervalRef.current != null)
        clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = window.setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return;

        // Only send a new ping if none is in flight
        if (inFlightPingStartedAtRef.current != null) return;

        const t0 = performance.now();
        inFlightPingStartedAtRef.current = t0;
        ws.send(JSON.stringify({ type: "ping", data: { t0 } }));
        // Optional safety timeout
        window.setTimeout(() => {
          if (
            inFlightPingStartedAtRef.current === t0 &&
            ws.readyState === WebSocket.OPEN
          ) {
            // Mark it as timed out so next interval can send a new one
            inFlightPingStartedAtRef.current = null;
          }
        }, 10000);
      }, 5000);
    };

    ws.onmessage = (event) => {
      const data: DataObject = JSON.parse(event.data);
      switch (data.type) {
        case "public_message": {
          const { username, message } = data.data;
          setMessages((prev) => [...prev, `${username}: ${message}`]);
          break;
        }
        case "pong": {
          const { t0 } = data.data;
          const started = inFlightPingStartedAtRef.current;
          const end = performance.now();
          let rtt: number;
          if (started != null) {
            rtt = end - started;
          } else {
            rtt = end - t0;
          }
          inFlightPingStartedAtRef.current = null;
          setPingMs((prev) => {
            const next = Math.round(rtt);
            return prev == null ? next : Math.round(prev * 0.6 + next * 0.4);
          });
          break;
        }
        case "update_player_count": {
          setPlayersConnected(data.data.newCount);
          break;
        }
        default:
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setPingMs(null);
      if (pingIntervalRef.current != null) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      inFlightPingStartedAtRef.current = null;
      console.log("WebSocket connection closed");
    };

    return () => {
      if (pingIntervalRef.current != null) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      inFlightPingStartedAtRef.current = null;
      ws.close();
      wsRef.current = null;
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!chatMessage.trim()) return;
    wsRef.current?.send(
      JSON.stringify({
        type: "public_message",
        data: { username: username.trim(), message: chatMessage },
      })
    );
    setChatMessage("");
  };

  return (
    <div className="relative w-screen h-screen">
      <TrainProvider>
        <PassengerProvider>
          <CollectibleProvider>
            <Canvas camera={{ position: [0, 18, 5] }} shadows>
              <Suspense>
                <Physics gravity={[0, -20, 0]} colliders="cuboid" debug={false}>
                  {coalPositions.generatedPositions.map((pos, index) => (
                    <Coal
                      key={`Coal-${pos[0]}-${pos[1]}-${pos[2]}-${index}`}
                      id={index}
                      position={pos}
                      dimensions={[1, 1, 1]}
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
            <UI railsCollected={railsCollected} />
          </CollectibleProvider>
        </PassengerProvider>
      </TrainProvider>
      <div
        id="notification-parent"
        className={`absolute top-15 px-4 w-full z-1`}
      >
        <div
          id="disconnected-message"
          className={`bg-gradient-to-b from-gray-900/80 to-gray-950/80 backdrop-blur-sm rounded-lg p-3 text-white shadow-lg text-center comic-text transition-opacity ease-out duration-750 ${
            isConnected ? "opacity-0" : "opacity-100"
          }`}
        >
          You have been Disconnected.
        </div>
      </div>
      <div
        id="public_chat"
        className="absolute bottom-5 right-5 z-10 w-160 h-80 rounded-lg p-3 text-white
                   bg-gradient-to-t from-gray-900/70 to-gray-900/20 backdrop-blur-sm shadow-lg
                   flex flex-col comic-text"
      >
        <div id="client_stats" className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded bg-white/10 text-center px-2 py-1">
            <p id="client_visit_count">
              {`Visitor Count: ${visitorCount !== null ? visitorCount : "..."}`}
            </p>
          </div>
          <div className="rounded bg-white/10 text-center px-2 py-1">
            <p id="client_ping_ms">
              {`Ping: ${pingMs !== null ? pingMs : "..."} ms`}
            </p>
          </div>
          <div className="rounded bg-white/10 text-center px-2 py-1">
            <p id="client_players_connected">
              {`Players: ${playersConnected}`}
            </p>
          </div>
        </div>

        {/* Messages fill from bottom upward */}
        <div
          className="mt-2 min-h-0 flex-1 overflow-y-scroll overflow-x-hidden flex flex-col space-y-0 pr-2 chat_scrollbar"
          ref={messagesContainerRef}
        >
          {messages.map((m, i) => {
            const baseClass = "whitespace-pre-wrap break-words text-sm pl-2";
            if (i % 2 === 0) {
              return (
                <p key={i} className={`${baseClass} bg-black/40`}>
                  {m}
                </p>
              );
            } else {
              return (
                <p key={i} className={`${baseClass} bg-black/20`}>
                  {m}
                </p>
              );
            }
          })}
        </div>

        <input
          id="public_username"
          type="text"
          placeholder="Enter your name..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
          className={`mt-2 w-full rounded bg-white/10 border border-white/20 px-2 py-1 placeholder-white/60 ${
            !isConnected ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!isConnected}
        />
        <div className="mt-2 flex gap-2">
          <input
            id="public_chat_input"
            type="text"
            placeholder="Type your message here..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            maxLength={140}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className={`flex-1 rounded bg-white/10 border border-white/20 px-2 py-1 placeholder-white/60 ${
              !isConnected ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
          <button
            id="public_chat_send"
            className={`rounded bg-blue-500/80 hover:bg-blue-500 px-3 text-white ${
              username.trim() === "" ||
              chatMessage.trim() === "" ||
              !isConnected
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={!username.trim() || !chatMessage.trim() || !isConnected}
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
