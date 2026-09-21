# Hostinger deployment

Deploy this as a Node.js / Express application. The Express server serves both
the API and the React build on the same domain. Upload the complete application
archive, not just the frontend build.

## Build and start

| Setting | Value |
| --- | --- |
| Project root | Archive root (contains package.json) |
| Framework | Express |
| Node.js | 24.x |
| Install command | npm ci --include=dev |
| Build command | npm run build |
| Combined install/build if only one field is available | npm ci --include=dev && npm run build |
| Entry file | server.js |
| Start command | npm start |
| Frontend output directory | client/dist |

Keep server.js, server/, and runtime dependencies in the deployed application.
Selecting a static Vite-only deployment will not run the API. Dev dependencies
are needed during the build even when NODE_ENV is production. Startup does not
rebuild the frontend, so production runtime can omit dev dependencies.

## Environment variables

Set these in Hostinger; never upload the private .env file:

```dotenv
NODE_ENV=production
HOST=0.0.0.0
MONGODB_URI=<your Atlas connection string with URL-encoded credentials>
MONGODB_DB_NAME=portfolio
MONGODB_LOCAL_FALLBACK=false
JWT_SECRET=<a private random value of at least 32 characters>
ADMIN_EMAIL=<your admin email>
ADMIN_PASSWORD=<your private admin password, at least 8 characters>
CLIENT_URL=https://<your deployed domain>
VITE_API_URL=/api
UPLOAD_DIR=<absolute persistent writable directory for uploaded media>
```

Use the port supplied by the hosting platform; do not copy the local PORT value.
CLIENT_URL must exactly match the HTTPS origin, without a trailing slash. Multiple
origins can be comma-separated. Update it when connecting a custom domain.
Both admin variables are required by startup validation, even when an account
already exists. Use the existing account settings, not example credentials.

Atlas must allow the hosting server's outbound IP and the database user must have
access to the selected database. Run npm run db:check in the deployed environment
to verify connectivity without changing records. A ZIP contains application files,
not MongoDB records: use the same Atlas database to preserve saved portfolio content.

## Upload persistence

The current upload implementation uses the filesystem. Before accepting uploads,
confirm that UPLOAD_DIR survives restarts AND redeployments on your hosting plan.
If the platform has only ephemeral storage, persistent object storage integration
is required before live uploads are safe. Do not assume a folder inside the release
directory is persistent. Existing media is included in the ZIP; copy server/uploads
to the configured persistent directory if setting a different UPLOAD_DIR.

## Deployment and verification

1. Websites > Add Website > Deploy Web App > Upload your website files.
2. Upload portfolio-hostinger-ready.zip and apply the settings above.
3. Deploy and confirm the logs show MongoDB connected and API listening.
4. Open /api/health (expects {"status":"ok"}), /, and /admin/login.
5. Sign in, check saved content, and verify an upload remains accessible after restart.
6. Connect the intended domain, enable HTTPS, and update CLIENT_URL.

Local verification does not verify Hostinger account access, Atlas access from
Hostinger, DNS, TLS, or upload persistence. Check those on the actual deployment.

Official setup reference:
https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/

## Startup compatibility verification

The production module graph has no top-level await. Database connection and
initialization run inside async startup functions. Verified on Node 24 with
both `node server.js` and CommonJS `require('./server.js')`.
Run `node scripts/check-production.mjs` and
`node scripts/check-production.mjs --require` after building to repeat these
isolated MongoDB checks without changing the configured Atlas database.

## MongoDB shard DNS errors (getaddrinfo ENOTFOUND)

If Atlas SRV discovery works but a shard hostname fails to resolve, configure
`MONGODB_DNS_SERVERS` with DNS servers reachable from your runtime, for example
`1.1.1.1,8.8.8.8` if your network allows them. Restart the Node.js process.
The application applies this override to both SRV/TXT discovery and Atlas shard
address lookups. Without this variable, the system resolver remains in use.
Do not replace Atlas hostnames with fixed IPs or disable TLS validation.

Run `npm run db:check` from the application directory. If DNS still times out,
verify that the configured resolvers are reachable from that machine. If the
hostname does not exist, compare MONGODB_URI with the current Atlas Connect string
and confirm the cluster is available.
