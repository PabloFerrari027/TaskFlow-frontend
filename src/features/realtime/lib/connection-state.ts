// Whether the workspace's realtime channel is currently open. Kept outside
// React because the sync poll only needs a synchronous read at tick time, and
// a state change here must not re-render (or re-create) anything.
let connected = false;

export function isRealtimeConnected() {
  return connected;
}

export function setRealtimeConnected(value: boolean) {
  connected = value;
}
