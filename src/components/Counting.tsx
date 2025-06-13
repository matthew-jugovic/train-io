import { Html } from '@elysiajs/html'

interface ActivityMessage {
  Activity_Time: number;
}

function initializeWebSocket(): void {
  const ws = new WebSocket("ws://localhost:3000/ws");
  
  ws.onopen = () => {
    console.log("WebSocket connection established");
    const statusElement = document.getElementById("activity_status");
    if (statusElement) {
      statusElement.innerText = "Connected";
    }
    const msg: ActivityMessage = { Activity_Time: -1 };
    ws.send(JSON.stringify(msg));
  };

  ws.onmessage = (event) => {
    const element = document.getElementById("activity_time");
    if (event.data && element) {
      try {
        const receivedData: ActivityMessage = JSON.parse(event.data);
        if (receivedData.Activity_Time !== undefined) {
          const activityTime = receivedData.Activity_Time;
          element.innerText = `People have spent a total of ${activityTime.toFixed(1)} seconds on this website!`;

          const msg: ActivityMessage = { Activity_Time: 0 };
          ws.send(JSON.stringify(msg));
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }
  };

  ws.onclose = () => {
    const statusElement = document.getElementById("activity_status");
    if (statusElement) {
      statusElement.innerText = "Disconnected";
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

export function CounterPage({ visits }: { visits: number }) {
  return (
    <html lang="en">
      <head>
        <title>TEST</title>
        <meta charset="UTF-8" />
      </head>
      <body>
        <h1>Welcome to the Counter Page!</h1>
        <p>This page has been visited {visits} times!</p>
        <p id="activity_status">...</p>        <p id="activity_time">...</p>
        
        <script type="text/javascript">
          {`(${initializeWebSocket.toString()})()`}
        </script>
      </body>
    </html>
  );
}