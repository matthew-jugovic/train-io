export type DataObject =
    | { type: "public_message"; data: { username: string; message: string; discord: BooleanConstructor } }
    | { type: "heartbeat" }
    | { type: "ping"; data: { t0: number } }
    | { type: "pong"; data: { t0: number } }
    | { type: "update_player_count"; data: { newCount: number } }
    | { type: "discord_auth"; data: { discord_token: string}}
    | { type: "session_auth"; data: { session_token: string}}