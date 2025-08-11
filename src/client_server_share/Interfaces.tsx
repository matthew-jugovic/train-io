export type DataObject =
    | {type: "public_message"; data: {username: string; message: string}}
    | {type: "heartbeat"; data: null}