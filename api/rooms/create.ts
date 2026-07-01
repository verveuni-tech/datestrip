import { createRoom } from "../_lib/rooms.js";

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const room = await createRoom();
    response.status(200).json({ room });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create a room right now.";
    response.status(500).json({ error: message });
  }
}
