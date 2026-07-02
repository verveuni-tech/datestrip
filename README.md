<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cc2bee05-4bce-4585-a997-dbef3158c9b9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Set the `DATABASE_URL` in `.env.local` to your Neon Postgres connection string if you want shared photobooth room creation/joining
4. Optional: set `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` / `PUSHER_CLUSTER` (and matching `VITE_PUSHER_KEY` / `VITE_PUSHER_CLUSTER`) from a free [Pusher Channels](https://pusher.com/channels) app for instant countdown sync in joint capture sessions. Without these, joint capture still works correctly via polling, just with a bit more lag on the first countdown tick.
5. Run the app:
   `npm run dev`
