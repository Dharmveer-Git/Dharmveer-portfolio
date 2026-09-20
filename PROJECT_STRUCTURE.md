# Portfolio Project Structure

Use `C:\project file\Pro\portfolio` as the project root. You are already in
the project when PowerShell displays:

```text
PS C:\project file\Pro\portfolio>
```

Do not run `cd portfolio-project`; that is the package name, not a folder.

## Folder map

```text
portfolio/
|-- client/                     React + Vite frontend
|   |-- public/                 Public files, icons, resume and uploads
|   `-- src/
|       |-- admin/              Admin dashboard
|       |   |-- components/     Admin layout and navigation components
|       |   |-- pages/          Admin dashboard pages
|       |   `-- styles/         Admin-only CSS
|       |-- api/                Frontend API client
|       |-- assets/             Imported images and SVG files
|       |-- components/         Reusable public components
|       |-- pages/              Active public pages
|       |-- styles/             Public site CSS
|       |-- App.jsx             Route definitions only
|       `-- main.jsx            React entry point
|-- server/                     Express + MongoDB backend
|   |-- config/                 Database configuration
|   |-- controllers/            Request and business logic
|   |-- middleware/             Authentication and error handling
|   |-- models/                 MongoDB/Mongoose models
|   |-- routes/                 API route definitions
|   |-- utils/                  Backend helpers
|   `-- index.js                Backend entry point
|-- scripts/                    Development helper scripts
|-- server.js                   Production server entry point
|-- package.json                Commands and dependencies
|-- .env                        Private local configuration (do not commit)
`-- .env.example                Environment variable template
```

Generated folders such as `node_modules`, `client/dist`, and `server/data`
should not be edited manually.

## Where to edit

| Change | Location |
|---|---|
| Active home page | `client/src/pages/Portfolio.jsx` |
| Project details / privacy / 404 | `client/src/pages/` |
| Navbar or footer | `client/src/components/` |
| Public design/CSS | `client/src/styles/` |
| Admin page | `client/src/admin/pages/` |
| Admin design/CSS | `client/src/admin/styles/` |
| API request from React | `client/src/api/api.js` |
| API endpoint | `server/routes/` |
| Backend logic | `server/controllers/` |
| Database fields | `server/models/` |
| Images and documents | `client/public/` or `client/src/assets/` |

## Environment and database files

| File/folder | Purpose | Editing rule |
|---|---|---|
| `.env` | Real local secrets and URLs | Edit locally; never share or commit |
| `.env.example` | Safe configuration template | Keep placeholders only; commit this file |
| `client/vite.config.js` | Frontend dev server and root env loading | Change only when frontend tooling/proxy changes |
| `server/config/db.js` | MongoDB Atlas connection | Never put passwords or full private URIs here |
| `server/models/` | MongoDB document schemas | Put database field definitions here |
| `server/data/` | Generated local MongoDB files | Never edit manually; ignored by Git |

For local development, keep `NODE_ENV=development`, `CLIENT_URL=http://localhost:5173`,
and `VITE_API_URL=/api`. For production, set `NODE_ENV=production` and use the public
HTTPS domain for `CLIENT_URL`.

## Backend MVC rule

```text
HTTP request -> Route -> Middleware -> Controller -> Model -> MongoDB
```

- `routes/apiRoutes.js`: only URLs, HTTP methods, middleware and controller mapping.
- `controllers/`: validation flow, request handling and response logic.
- `models/`: Mongoose schemas and database rules only.
- `middleware/`: reusable authentication, upload and error-processing logic.
- `config/`: database and application connection configuration.

Do not write MongoDB queries or business logic directly inside route files.

Admin-managed portfolio text and records should be edited from the admin
dashboard and saved through the API, rather than hardcoded into React files.

## Commands

Run commands from the `portfolio` root:

```powershell
npm run dev       # frontend and backend development servers
npm run lint      # code checks
npm run build     # production frontend build
npm start         # build and start production server
```

## Development roadmap

1. Keep the public portfolio responsive and accessible.
2. Complete each focused admin management page.
3. Connect every editable field to the protected backend API and MongoDB.
4. Add server-side validation for forms, URLs and uploads.
5. Verify authentication and permissions for every admin mutation.
6. Run lint and build checks before deployment.
7. Configure production environment variables and persistent upload storage.

## Frontend entry flow

`client/index.html` -> `src/main.jsx` -> `src/App.jsx` -> `src/pages/` or `src/admin/pages/`.

Global CSS: `styles/global.css`. Public CSS: `styles/portfolio.css`. Admin CSS: `admin/styles/`. Active admin content routes use `ManageContent.jsx`. Unused section components and placeholder modules have been removed.
