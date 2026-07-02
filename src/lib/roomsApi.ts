import { isValidRoomCode, normalizeRoomCode } from "./roomCode";

export type SharedRoom = {
  roomCode: string;
  hostName: string | null;
  guestName: string | null;
  createdAt: string;
  updatedAt: string;
  lastJoinedAt: string | null;
  layoutId: string | null;
  themeId: string | null;
  status: "lobby" | "capturing" | "done";
  currentFrameIndex: number;
  countdownTarget: string | null;
};

export type RoomFrames = Record<number, { host?: string; guest?: string }>;

type RoomResponse = {
  room: SharedRoom;
};

type RoomStateResponse = {
  room: SharedRoom;
  frames: RoomFrames;
};

async function readRoomResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | RoomResponse
    | { error?: string }
    | null;

  if (!response.ok || !payload || !("room" in payload)) {
    throw new Error(payload && "error" in payload && payload.error ? payload.error : "Unable to connect to the room right now.");
  }

  return payload.room;
}

export async function createRoomRequest() {
  const response = await fetch("/api/rooms/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return readRoomResponse(response);
}

export async function joinRoomRequest(roomCode: string) {
  const normalizedRoomCode = normalizeRoomCode(roomCode);

  if (!isValidRoomCode(normalizedRoomCode)) {
    throw new Error("Enter a valid 5-character room code.");
  }

  const response = await fetch("/api/rooms/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomCode: normalizedRoomCode }),
  });

  return readRoomResponse(response);
}

export async function saveParticipantRequest(roomCode: string, role: "host" | "guest", name: string) {
  const response = await fetch("/api/rooms/participant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomCode: normalizeRoomCode(roomCode),
      role,
      name: name.trim(),
    }),
  });

  return readRoomResponse(response);
}

export async function configureRoomRequest(roomCode: string, layoutId: string, themeId: string) {
  const response = await fetch("/api/rooms/configure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomCode: normalizeRoomCode(roomCode),
      layoutId,
      themeId,
    }),
  });

  return readRoomResponse(response);
}

export async function startCountdownRequest(roomCode: string, frameIndex: number) {
  const response = await fetch("/api/rooms/countdown", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomCode: normalizeRoomCode(roomCode),
      frameIndex,
    }),
  });

  return readRoomResponse(response);
}

export async function submitFrameRequest(
  roomCode: string,
  side: "host" | "guest",
  frameIndex: number,
  photoDataUrl: string
) {
  const response = await fetch("/api/rooms/frame", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomCode: normalizeRoomCode(roomCode),
      side,
      frameIndex,
      photoDataUrl,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

  if (!response.ok || !payload || !payload.ok) {
    throw new Error(payload && payload.error ? payload.error : "Unable to submit the frame right now.");
  }
}

export async function pollRoomStateRequest(roomCode: string): Promise<RoomStateResponse> {
  const response = await fetch(`/api/rooms/state?code=${encodeURIComponent(normalizeRoomCode(roomCode))}`);
  const payload = (await response.json().catch(() => null)) as RoomStateResponse | { error?: string } | null;

  if (!response.ok || !payload || !("room" in payload)) {
    throw new Error(payload && "error" in payload && payload.error ? payload.error : "Unable to fetch room state right now.");
  }

  return payload;
}
