# Eagles Events Deployment (Render + Vercel)

This repo is set up to deploy:
- Backend API to Render (Node/Express, root: `backend/`).
- Frontend (CRA) to Vercel (root: `frontend/`).

## Backend on Render

We added `render.yaml` at the repo root.

Service overview:
- Type: Web Service
- Root directory: `backend`
- Build: `npm install`
- Start: `npm start`
- Node: 18
- Health check: `/api/health`

Required environment variables (Render Dashboard → Environment):
- MONGO_URI: MongoDB Atlas connection string
- JWT_SECRET: Secret for JWT signing
- ALLOWED_ORIGINS: Comma-separated list of allowed origins (e.g. https://your-frontend.vercel.app,https://your-domain)
- FRONTEND_URL: Public URL of your frontend (e.g. https://your-frontend.vercel.app)
- BACKEND_URL: Public URL of this API (e.g. https://eagles-events-api.onrender.com)

Email (optional, choose either SMTP_* or EMAIL_* style):
- SMTP_HOST
- SMTP_PORT (e.g. 587)
- SMTP_SECURE (true|false)
- SMTP_USER
- SMTP_PASS
- EMAIL_SERVICE (e.g. gmail) [alternative to SMTP_*]
- EMAIL_USER
- EMAIL_PASS or EMAIL_PASSWORD
- EMAIL_FROM (fallback sender)
- EMAIL_TO or CONTACT_TO (for contact notifications)
- ADMIN_EMAILS (comma-separated list)

Other optional:
- BASE_URL (used to build upload links; defaults to runtime host)
- NOTIFY_ADMINS (true|false, default true)

Notes:
- The server reads `PORT` from the platform; do not hardcode.
- Health check is available at `/api/health`.

## Frontend on Vercel

We added `frontend/vercel.json` targeting CRA with `outputDirectory: build`.

Required environment variables (Vercel Project → Settings → Environment Variables):
- REACT_APP_API_URL: The backend base URL (e.g. https://eagles-events-api.onrender.com)

Build:
- Framework: Create React App
- Build Command: `npm run build`
- Output Directory: `build`
- Root Directory: `frontend`

Caching headers for static assets are configured in `vercel.json`.

## End-to-end steps

1) Create Render Web Service
- From this GitHub repo (or connect repo), Render will detect `render.yaml`.
- Select the service `eagles-events-api`.
- Set Environment to Node; Node 18.
- Add required environment variables listed above.
- Deploy; wait until health check `/api/health` is healthy.

2) Create Vercel Project
- Import the same repo in Vercel.
- Set Project Root Directory to `frontend/`.
- Ensure Build Command `npm run build` and Output Directory `build`.
- Add `REACT_APP_API_URL` env var pointing to the Render API URL.
- Deploy.

3) Update CORS on Backend
- In Render, set `ALLOWED_ORIGINS` to include:
  - Your Vercel preview/prod domains (e.g. https://your-project.vercel.app)
  - Any custom domains serving the frontend.

4) Optional custom domains
- Add custom domain in Vercel and in Render; update `FRONTEND_URL` and `BACKEND_URL` accordingly.

## Where base URLs are used in code
- Frontend API base: `frontend/src/services/api.js` uses `process.env.REACT_APP_API_URL` and falls back to a demo Render URL. Set the env var so it targets your backend.
- Backend uses envs in:
  - `backend/src/config/db.js`: `MONGO_URI`
  - `backend/src/middleware/authMiddleware.js`: `JWT_SECRET`
  - `backend/src/server.js`: `ALLOWED_ORIGINS`, `NODE_ENV`
  - `backend/src/config/email.js` and `backend/src/utils/emailService.js`: SMTP/EMAIL_* vars, `EMAIL_FROM`
  - `backend/src/routes/contactRoutes.js`: `CONTACT_TO`/`EMAIL_TO`
  - `backend/src/controllers/quoteController.js`: `ADMIN_EMAILS`, `FRONTEND_URL`, `BACKEND_URL`, `NOTIFY_ADMINS`
  - `backend/src/controllers/uploadController.js`: `BASE_URL`

## Troubleshooting
- 403 CORS: Ensure `ALLOWED_ORIGINS` contains the exact origin(s) of your frontend.
- 500 DB errors: Verify `MONGO_URI` and whitelist Render IPs in MongoDB Atlas or set to allowed anywhere (0.0.0.0/0) temporarily for testing.
- Emails not sending: Provide SMTP/EMAIL_* vars; otherwise the app logs emails instead of sending in production.
