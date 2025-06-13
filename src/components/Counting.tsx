import { Html } from '@elysiajs/html'
import type { ActivityTime } from '../common/types.tsx'

export function CounterPage({ visits }: { visits: number}) {
  return (
    <html lang="en">
      <head>
        <title>TEST</title>
        <meta charset="UTF-8" />
      </head>
      <body>
        <h1>Welcome to the Counter Page!</h1>
        <p>This page has been visited {visits} times!</p>
        <p id="activity_status">...</p>
        <p id="activity_time">...</p>
        
        <script>{`
          const ws = new WebSocket("ws://" + location.host + "/ws");
          
          ws.onopen = () => {
            console.log("WebSocket connection established");
            const status_element = document.getElementById("activity_status");
            status_element.innerText = "Connected";
            const msg = {data: 0};
            ws.send(JSON.stringify(msg));
          }

          ws.onmessage = (event) => {
            const element = document.getElementById("activity_time");
            if (event.data) {
              const data = JSON.parse(event.data);
              if (data && typeof data === 'object' && 'type' in data && data.type === 'ActivityTime') {
                const activity_time = data;
                element.innerText = \`You have been on this page for \${activity_time.data} seconds!\`

                const msg = {data: 0}
                ws.send(JSON.stringify(msg))
              }
            }
          }

          ws.onclose = () => {
            const status_element = document.getElementById("activity_status");
            status_element.innerText = "Disconnected";
          }
        `}</script>
      </body>
    </html>
  );
}