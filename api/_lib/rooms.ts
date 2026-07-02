import { neon } from "@neondatabase/serverless";
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from "../../src/lib/roomCode.js";

const COUNTDOWN_LEAD_MS = 4000;

type RoomRow = {
  room_code: string;
  host_name: string | null;
  guest_name: string | null;
  created_at: string;
  updated_at: string;
  last_joined_at: string | null;
  layout_id: string | null;
  theme_id: string | null;
  status: "lobby" | "capturing" | "done";
  current_frame_index: number;
  countdown_target: string | null;
};

export type RoomRecord = {
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

type FrameRow = {
  frame_index: number;
  side: "host" | "guest";
  photo_data: string;
};

export type RoomState = {
  room: RoomRecord;
  frames: Record<number, { host?: string; guest?: string }>;
};

const ROOM_COLUMNS = `room_code, host_name, guest_name, created_at, updated_at, last_joined_at, layout_id, theme_id, status, current_frame_index, countdown_target`;

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
    layoutId: row.layout_id,
    themeId: row.theme_id,
    status: row.status,
    currentFrameIndex: row.current_frame_index,
    countdownTarget: row.countdown_target,
  };
}

function assertValidRoomCode(roomCode: string) {
  const normalizedRoomCode = normalizeRoomCode(roomCode);

  if (!isValidRoomCode(normalizedRoomCode)) {
    throw new Error("Enter a valid 5-character room code.");
  }

  return normalizedRoomCode;
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

      await sql`ALTER TABLE photobooth_rooms ADD COLUMN IF NOT EXISTS layout_id TEXT`;
      await sql`ALTER TABLE photobooth_rooms ADD COLUMN IF NOT EXISTS theme_id TEXT`;
      await sql`ALTER TABLE photobooth_rooms ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'lobby'`;
      await sql`ALTER TABLE photobooth_rooms ADD COLUMN IF NOT EXISTS current_frame_index INT NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE photobooth_rooms ADD COLUMN IF NOT EXISTS countdown_target TIMESTAMPTZ`;

      await sql`
        CREATE TABLE IF NOT EXISTS photobooth_frames (
          room_code TEXT NOT NULL,
          frame_index INT NOT NULL,
          side TEXT NOT NULL CHECK (side IN ('host', 'guest')),
          photo_data TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (room_code, frame_index, side)
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
        RETURNING ${sql.unsafe(ROOM_COLUMNS)}
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
  const normalizedRoomCode = assertValidRoomCode(roomCode);

  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    UPDATE photobooth_rooms
    SET last_joined_at = NOW(), updated_at = NOW()
    WHERE room_code = ${normalizedRoomCode}
    RETURNING ${sql.unsafe(ROOM_COLUMNS)}
  `) as RoomRow[];

  if (!rows[0]) {
    throw new Error("We couldn't find that room code. Ask your partner to create a room first.");
  }

  return mapRoom(rows[0]);
}

export async function saveParticipant(roomCode: string, role: "host" | "guest", name: string) {
  const normalizedRoomCode = assertValidRoomCode(roomCode);
  const trimmedName = name.trim();

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
          RETURNING ${sql.unsafe(ROOM_COLUMNS)}
        `
      : await sql`
          UPDATE photobooth_rooms
          SET guest_name = ${trimmedName}, updated_at = NOW()
          WHERE room_code = ${normalizedRoomCode}
          RETURNING ${sql.unsafe(ROOM_COLUMNS)}
        `
  ) as RoomRow[];

  if (!rows[0]) {
    throw new Error("This room no longer exists.");
  }

  return mapRoom(rows[0]);
}

export async function configureRoom(roomCode: string, layoutId: string, themeId: string) {
  const normalizedRoomCode = assertValidRoomCode(roomCode);

  if (!layoutId || !themeId) {
    throw new Error("layoutId and themeId are required.");
  }

  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    UPDATE photobooth_rooms
    SET layout_id = ${layoutId}, theme_id = ${themeId}, updated_at = NOW()
    WHERE room_code = ${normalizedRoomCode}
    RETURNING ${sql.unsafe(ROOM_COLUMNS)}
  `) as RoomRow[];

  if (!rows[0]) {
    throw new Error("This room no longer exists.");
  }

  return mapRoom(rows[0]);
}

export async function startCountdown(roomCode: string, frameIndex: number) {
  const normalizedRoomCode = assertValidRoomCode(roomCode);

  if (!Number.isInteger(frameIndex) || frameIndex < 0) {
    throw new Error("frameIndex must be a non-negative integer.");
  }

  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    UPDATE photobooth_rooms
    SET
      current_frame_index = ${frameIndex},
      status = 'capturing',
      countdown_target = NOW() + make_interval(secs => ${COUNTDOWN_LEAD_MS / 1000}),
      updated_at = NOW()
    WHERE room_code = ${normalizedRoomCode}
    RETURNING ${sql.unsafe(ROOM_COLUMNS)}
  `) as RoomRow[];

  if (!rows[0]) {
    throw new Error("This room no longer exists.");
  }

  return mapRoom(rows[0]);
}

export async function markRoomDone(roomCode: string) {
  const normalizedRoomCode = assertValidRoomCode(roomCode);

  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    UPDATE photobooth_rooms
    SET status = 'done', updated_at = NOW()
    WHERE room_code = ${normalizedRoomCode}
    RETURNING ${sql.unsafe(ROOM_COLUMNS)}
  `) as RoomRow[];

  if (!rows[0]) {
    throw new Error("This room no longer exists.");
  }

  return mapRoom(rows[0]);
}

export async function submitFrame(roomCode: string, side: "host" | "guest", frameIndex: number, photoDataUrl: string) {
  const normalizedRoomCode = assertValidRoomCode(roomCode);

  if (!Number.isInteger(frameIndex) || frameIndex < 0) {
    throw new Error("frameIndex must be a non-negative integer.");
  }

  if (!photoDataUrl || !photoDataUrl.startsWith("data:image/")) {
    throw new Error("photoDataUrl must be an image data URL.");
  }

  await ensureSchema();
  const sql = getSql();

  await sql`
    INSERT INTO photobooth_frames (room_code, frame_index, side, photo_data)
    VALUES (${normalizedRoomCode}, ${frameIndex}, ${side}, ${photoDataUrl})
    ON CONFLICT (room_code, frame_index, side)
    DO UPDATE SET photo_data = EXCLUDED.photo_data, created_at = NOW()
  `;
}

export async function getRoomState(roomCode: string): Promise<RoomState> {
  const normalizedRoomCode = assertValidRoomCode(roomCode);

  await ensureSchema();
  const sql = getSql();

  const rooms = (await sql`
    SELECT ${sql.unsafe(ROOM_COLUMNS)}
    FROM photobooth_rooms
    WHERE room_code = ${normalizedRoomCode}
  `) as RoomRow[];

  if (!rooms[0]) {
    throw new Error("This room no longer exists.");
  }

  const frameRows = (await sql`
    SELECT frame_index, side, photo_data
    FROM photobooth_frames
    WHERE room_code = ${normalizedRoomCode}
  `) as FrameRow[];

  const frames: Record<number, { host?: string; guest?: string }> = {};

  for (const row of frameRows) {
    if (!frames[row.frame_index]) {
      frames[row.frame_index] = {};
    }
    frames[row.frame_index][row.side] = row.photo_data;
  }

  return { room: mapRoom(rooms[0]), frames };
}
