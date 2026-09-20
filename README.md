# Dharmveer-portfolio

React/Vite portfolio with an Express API, MongoDB Atlas persistence, JWT-protected admin dashboard, content CRUD, contact messages, and file uploads.

## Local setup

1. Copy the values from `.env.example` into `.env`.
2. Replace `DB_USERNAME`, `NEW_DB_PASSWORD`, `YOUR_CLUSTER_HOST`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` with private values. URL-encode special characters in the database username or password.
3. In MongoDB Atlas, create the database user and allow your current IP in Network Access.
4. Start the complete development environment (frontend + backend):

   ```powershell
   npm run dev
   ```

   Use `npm run frontend` or `npm run server` only when you want to run one
   side separately. `npm start` is the production command; it builds the
   frontend before starting the server.

Portfolio: http://localhost:5173  
Admin login: http://localhost:5173/admin/login  
API health: http://localhost:5001/api/health

The first backend start creates the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD` when it does not already exist.

## Editing guide

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for the folder map and a
quick guide to where each type of change belongs.

## API resources

- `/api/admin/login`, `/api/admin/me`, `/api/admin/overview`
- `/api/profile`, `/api/about`, `/api/skills`, `/api/projects`
- `/api/experience`, `/api/education`, `/api/certificates`
- `/api/services`, `/api/socials`, `/api/messages`, `/api/upload`

GET content routes are public. Content mutations, uploads, admin routes, and message management require a Bearer JWT.

## Before deployment

- Replace `client/public/profile.jpg`, `client/public/resume.pdf`, and `client/public/favicon.ico` with real files.
- Replace sample project, education, certificate, experience, and social data from the admin dashboard.
- Set production environment variables in Hostinger; never upload `.env`.
- Set `CLIENT_URL` to the HTTPS production domain and `VITE_API_URL` to the deployed API URL.
- Enable Hostinger SSL/HTTPS and configure SPA fallback to `index.html`.
- Use persistent object storage for uploads if the Hostinger Node filesystem is ephemeral.

## Admin account settings

Use Admin Settings to change the email or password after signing in. The current password is required. A successful update invalidates existing sessions. Once changed in the dashboard, credentials are stored in MongoDB and are not overwritten by startup environment defaults. Environment credentials still bootstrap a new account.
