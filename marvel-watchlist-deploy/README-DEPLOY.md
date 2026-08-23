# Deployment

## Render backend
Deploy this repository to Render using the included `render.yaml` or set:
- Build: `chmod +x build.sh && ./build.sh`
- Start: `cd out && java com.marvelwatchlist.server.Main`

After deployment, copy the public Render URL.

## Vercel frontend
In Vercel, import the same GitHub repository and set **Root Directory** to `vercel-frontend`.
Before deploying, edit `vercel-frontend/js/app.js` and replace:
`https://YOUR-RENDER-SERVICE.onrender.com`
with your actual Render URL.

Redeploy Vercel after changing that URL.

Note: Render's local filesystem may reset on redeploy/restart, so watch progress stored in `data/progress.properties` is not durable on a typical ephemeral instance.
