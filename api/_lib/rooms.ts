import { neon } from "@neondatabase/serverless";
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from "../../src/lib/roomCode.js";

type RoomRow = {
  room_code: string;
  host_name: string | null;
  guest_name: string | null;
  created_at: string;
  updated_at: string;
  last_joined_at: string | null;
};

export type RoomRecord = {
  roomCode: string;
  hostName: string | null;
  guestName: string | null;
  createdAt: string;
  updatedAt: string;
  lastJoinedAt: string | null;
};

let schemaPromise: Promise<void> | null = null;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(databaseUrl);
}

function mapRoom(row: RoomRow): RoomRecord {
  return {
    roomCode: row.room_code,
    hostName: row.host_name,
    guestName: row.guest_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastJoinedAt: row.last_joined_at,
  };
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getSql();

      await sql`
        CREATE TABLE IF NOT EXISTS photobooth_rooms (
          room_code TEXT PRIMARY KEY,
          host_name TEXT,
          guest_name TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_joined_at TIMESTAMPTZ
        )
      `;
    })();
  }

  return schemaPromise;
}

export async function createRoom() {
  await ensureSchema();
  const sql = getSql();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const roomCode = generateRoomCode();

    try {
      const rows = (await sql`
        INSERT INTO photobooth_rooms (room_code)
        VALUES (${roomCode})
        RETURNING room_code, host_name, guest_name, created_at, updated_at, last_joined_at
      `) as RoomRow[];

      return mapRoom(rows[0]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (!message.toLowerCase().includes("duplicate")) {
        throw error;
      }
    }
  }

  throw new Error("Unable to create a unique room code.");
}

export async function joinRoom(roomCode: string) {
  const normalizedRoomCode = normalizeRoomCode(roomCode);

  if (!isValidRoomCode(normalizedRoomCode)) {
    throw new Error("Enter a valid 5-character room code.");
  }

  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    UPDATE photobooth_rooms
    SET last_joined_at = NOW(), updated_at = NOW()
    WHERE room_code = ${normalizedRoomCode}
    RETURNING room_code, host_name, guest_name, created_at, updated_at, last_joined_at
  `) as RoomRow[];

  if (!rows[0]) {
    throw new Error("We couldn't find that room code. Ask your partner to create a room first.");
  }

  return mapRoom(rows[0]);
}

export async function saveParticipant(roomCode: string, role: "host" | "guest", name: string) {
  const normalizedRoomCode = normalizeRoomCode(roomCode);
  const trimmedName = name.trim();

  if (!isValidRoomCode(normalizedRoomCode)) {
    throw new Error("Enter a valid 5-character room code.");
  }

  if (!trimmedName) {
    throw new Error("Name is required.");
  }

  await ensureSchema();
  const sql = getSql();
  const rows = (
    role === "host"
      ? await sql`
          UPDATE photobooth_rooms
          SET host_name = ${trimmedName}, updated_at = NOW()
          WHERE room_code = ${normalizedRoomCode}
          RETURNING room_code, host_name, guest_name, created_at, updated_at, last_joined_at
        `
      : await sql`
          UPDATE photobooth_rooms
          SET guest_name = ${trimmedName}, updated_at = NOW()
          WHERE room_code = ${normalizedRoomCode}
          RETURNING room_code, host_name, guest_name, created_at, updated_at, last_joined_at
        `
  ) as RoomRow[];

  if (!rows[0]) {
    throw new Error("This room no longer exists.");
  }

  return mapRoom(rows[0]);
}
