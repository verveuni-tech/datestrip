import Pusher from "pusher";

let pusherClient: Pusher | null = null;

function getPusher(): Pusher | null {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;

  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    return null;
  }

  if (!pusherClient) {
    pusherClient = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherClient;
}

export async function publishCountdown(roomCode: string, frameIndex: number, countdownTarget: string) {
  const pusher = getPusher();

  // Pusher is an optional latency optimization on top of polling — if it isn't
  // configured, silently no-op and let the existing state-poll fallback carry it.
  if (!pusher) {
    return;
  }

  try {
    await pusher.trigger(`room-${roomCode}`, "countdown", { frameIndex, countdownTarget });
  } catch {
    // Push is best-effort; polling still covers correctness if this fails.
  }
}
