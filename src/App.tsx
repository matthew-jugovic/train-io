import { Canvas } from "@react-three/fiber";
import { useEffect, useState, Suspense, useRef } from "react";
import {
  useRandomlyGeneratedPositions,
  type Range,
} from "./hooks/useRandomlyGeneratedPositions";
import Train from "./components/Train";
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

interface ChatMessage {
  username: string;
  message: string;
  discord: boolean;
}

function App() {
  const [railsCollected, setRailsCollected] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [discordToken, setDiscordToken] = useState<string | null>(null);
  const [discordLogin, setDiscordLogin] = useState<boolean>(false);

  const [username, setUsername] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
      fetch(`${import.meta.env.VITE_SERVER_URL}/visit`, {
        method: "POST",
      })
        .then((res) => res.json())
        .then((data) => {
          setVisitorCount(data.visit_count);
        });

      // Load last five messages into React state
      fetch(`${import.meta.env.VITE_SERVER_URL}/public_chat_log`)
        .then((res) => res.json())
        .then((data: { username: string; message: string; discord_id?: number }[]) => {
          console.log("Fetched chat log:", data);
          setMessages(data.map((msg) => ({ username: msg.username, message: msg.message, discord: msg.discord_id ? true : false })));
        })
        .catch((err) => {
          console.error("Error fetching chat log:", err);
        });

      // Discord auth
      const handleDiscordAuth = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SERVER_URL}/auth/discord/login`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ auth: code }),
              }
            );

            if (!response.ok) {
              throw new Error("Failed to authenticate with Discord");
            }

            // We got the session token.
            const data = await response.json();
            
            setUsername(data.username);
            setDiscordToken(data.session_token);
            setDiscordLogin(true);
            console.log("Discord authentication successful, session token received.");

            // Clear the code param from URL
            window.history.replaceState({}, document.title, "/");

            // Set session cookie
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 1);
            document.cookie = `sessionToken=${data.session_token}; expires=${expirationDate.toUTCString()}; path=/; secure; samesite=strict`;
            console.log(`Set sessionToken cookie: ${data.session_token}`);

            // Send the session token to server if WebSocket is open
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              const data_object = { type: "session_auth", data: { session_token: data.session_token } } as DataObject;
              wsRef.current.send(JSON.stringify(data_object));
              console.log("Sent session token to server via WebSocket.");
            }

            

          } catch (error) {
            console.error("Discord authentication error:", error);
          }

          // replace with base url
          // window.history.replaceState({}, document.title, "/");
        }
      };

      handleDiscordAuth();
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`${import.meta.env.VITE_SERVER_URL}/ws`);
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

        // If we have the discord token, send it to server for this session
        if (discordToken && !discordLogin) {
          const data_object = { type: "discord_auth", data: { discord_token: discordToken}} as DataObject
          ws.send(JSON.stringify(data_object))
          setDiscordLogin(true)
        }


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

      // If we have a session token cookie, send it to server for this session
      const session_token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sessionToken="))
        ?.split("=")[1]

      const data_object = {
        type: "session_auth",
        data: { session_token: session_token ?? "" },
      } as DataObject;
      ws.send(JSON.stringify(data_object))
      

      


    };

    ws.onmessage = (event) => {
      const data: DataObject = JSON.parse(event.data);
      switch (data.type) {
        case "public_message": {
          const { username, message } = data.data;
          setMessages((prev) => [...prev, { username, message, discord: data.data.discord }]);
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
        case "heartbeat": {
          const data_object: DataObject = { type: "heartbeat" };
          ws.send(JSON.stringify(data_object));
          break;
        }
        case "session_auth": {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 1);
          document.cookie = `sessionToken=${data.data.session_token}; expires=${expirationDate.toUTCString()}; path=/; secure; samesite=strict`;
          console.log(`Set sessionToken cookie: ${data.data.session_token}`);
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
        className={`absolute  top-46 px-4 w-85 z-1`}
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
        id="user_info_holder"
        className="absolute bottom-2 left-40 bg-gradient-to-t from-gray-900/70 to-gray-900/20 p-3 shadow-lg rounded-lg"
      >
        {discordLogin ? (
          <p className="text-white comic-text">Welcome, {username}!</p>
        ) : (
          <a
            href={import.meta.env.VITE_DISCORD_REDIRECT_URL}
            className="bg-blue-500/80 hover:bg-blue-500 px-3 py-2 rounded text-white comic-text"
          >
            Login with Discord
          </a>
        )}
      </div>
      <div
        id="public_chat"
        className="absolute bottom-5 right-5 z-10 w-120 h-70 rounded-lg p-3 text-white
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
            const bgClass = i % 2 === 0 ? "bg-black/40" : "bg-black/20";
            const usernameClass = m.discord ? "text-blue-400 font-bold drop-shadow-lg" : "text-white";
            return (
              <p key={i} className={`${baseClass} ${bgClass}`}>
                <span className={usernameClass}>{m.username}:</span> {m.message}
              </p>
            );
          })}
        </div>

        <input
          id="public_username"
          type="text"
          placeholder="Enter your name..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
          className={`mt-2 w-full rounded ${discordLogin ? 'bg-blue-500/80' : 'bg-white/10'} border border-white/20 px-2 py-1 placeholder-white/60 ${
            !isConnected ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!isConnected || discordLogin}
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
