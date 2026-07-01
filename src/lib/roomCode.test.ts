import test from "node:test";
import assert from "node:assert/strict";
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from "./roomCode";

test("normalizeRoomCode strips whitespace and punctuation while uppercasing", () => {
  assert.equal(normalizeRoomCode(" kx-7 r "), "KX7R");
});

test("isValidRoomCode accepts a normalized 5-character room code", () => {
  assert.equal(isValidRoomCode("kpnny"), true);
  assert.equal(isValidRoomCode("AB-12"), false);
});

test("generateRoomCode returns a 5-character code in the allowed alphabet", () => {
  const roomCode = generateRoomCode();

  assert.equal(roomCode.length, 5);
  assert.match(roomCode, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);
});
