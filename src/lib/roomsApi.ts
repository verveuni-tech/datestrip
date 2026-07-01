import { isValidRoomCode, normalizeRoomCode } from "./roomCode";

export type SharedRoom = {
  roomCode: string;
  hostName: string | null;
  guestName: string | null;
  createdAt: string;
  updatedAt: string;
  lastJoinedAt: string | null;
};

type RoomResponse = {
  room: SharedRoom;
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
