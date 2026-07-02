import { getRoomState } from "../_lib/rooms.js";

function readCode(request: any) {
  if (request.query && request.query.code) {
    return String(request.query.code);
  }

  const url = new URL(request.url ?? "", "http://localhost");
  return url.searchParams.get("code") ?? "";
}

export default async function handler(request: any, response: any) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const state = await getRoomState(readCode(request));
    response.status(200).json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch room state right now.";
    const statusCode = message.includes("exists") || message.includes("valid 5-character") ? 400 : 500;
    response.status(statusCode).json({ error: message });
  }
}
