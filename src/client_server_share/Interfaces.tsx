export type DataObject =
    | { type: "public_message"; data: { username: string; message: string } }
    | { type: "heartbeat"; data: null }
    | { type: "ping"; data: { t0: number } }
    | { type: "pong"; data: { t0: number } }
    | { type: "update_player_count"; data: { newCount: number } }