import { Html } from '@elysiajs/html'

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
        
        <script type="text/javascript">
        {`
          const ws = new WebSocket("ws://localhost:3000/ws");
          
          ws.onopen = () => {
            console.log("WebSocket connection established");
            const status_element = document.getElementById("activity_status");
            status_element.innerText = "Connected";
            const msg = {Activity_Time: -1};
            ws.send(JSON.stringify(msg));
          }

          ws.onmessage = (event) => {
            const element = document.getElementById("activity_time");
            if (event.data) {
              const received_data = JSON.parse(event.data);
              if (received_data.Activity_Time !== undefined) {
                const activity_time = received_data.Activity_Time;
                element.innerText = \`People have spent a total of \${activity_time.toFixed(1)} seconds on this website!\`

                const msg = {Activity_Time: 0}
                ws.send(JSON.stringify(msg));
              }
            }
          }

          ws.onclose = () => {
            const status_element = document.getElementById("activity_status");
            status_element.innerText = "Disconnected";
          }
        `}
        </script>
      </body>
    </html>
  );
}