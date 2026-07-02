import { startCountdown } from "../_lib/rooms.js";

function readBody(request: any) {
  if (!request.body) {
    return {};
  }

  if (typeof request.body === "string") {
    return JSON.parse(request.body);
  }

  return request.body;
}

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const body = readBody(request);
    const frameIndex = Number(body.frameIndex);
    const room = await startCountdown(body.roomCode ?? "", frameIndex);
    response.status(200).json({ room });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start the countdown right now.";
    const statusCode = message.includes("must be") || message.includes("exists") || message.includes("valid 5-character") ? 400 : 500;
    response.status(statusCode).json({ error: message });
  }
}
