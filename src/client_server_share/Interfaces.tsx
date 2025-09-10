export type DataObject =
    | { type: "public_message"; data: { username: string; message: string } }
    | { type: "heartbeat" }
    | { type: "ping"; data: { t0: number } }
    | { type: "pong"; data: { t0: number } }
    | { type: "update_player_count"; data: { newCount: number } }
    | { type: "discord_auth"; data: { access_token: string, refresh_token?: string }}
