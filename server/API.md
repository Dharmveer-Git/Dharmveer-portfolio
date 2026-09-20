# Portfolio backend

Run `npm.cmd run server:dev` for the development API or `npm.cmd run server` with a configured MongoDB connection. Configure the existing `.env.example` variables privately; never commit credentials.

The Express/Mongoose backend includes one environment-managed Super Admin, JWT authentication, portfolio CRUD, persisted ordering, site/footer/SEO/resume settings, validated image/PDF uploads, and contact messages. Existing public and admin UI API contracts are preserved.

## Routes

All paths below start with `/api`. Protected requests use `Authorization: Bearer <token>`.

| Method | Path | Access / behavior |
| --- | --- | --- |
| POST | /admin/login | Email and password; returns an eight-hour JWT |
| GET | /admin/me | Protected; current admin |
| GET | /admin/overview | Protected; totals, per-resource counts, latest five message summaries |
| GET | /portfolio | Published content and saved settings |
| GET / PUT | /settings | Public read, protected update; footer, visibility, theme, SEO and resume |
| GET | /:resource | Active content in saved order |
| GET | /admin/content/:resource | Protected; includes inactive content |
| POST | /:resource | Protected; create and append after the highest saved order |
| PUT / DELETE | /:resource/:id | Protected; edit or delete (profile/about cannot be deleted) |
| PATCH | /:resource/reorder | Protected; `{ "ids": ["..."] }`, every ID exactly once |
| POST | /messages | Public, rate limited; name, email, company (optional), subject, message |
| GET | /messages | Protected; full messages, newest first |
| GET | /messages/:id | Protected; full message details, without marking it read |
| PATCH | /messages/:id/read | Protected; `{ "read": true }` or `{ "read": false }` |
| DELETE | /messages/:id | Protected; delete a message |
| POST | /upload | Protected; multipart `file`, JPEG/PNG/WebP/PDF up to 10 MB |

Resources: profile, about, skills, projects, experience, education, certificates, services, socials. Reordering: skills, projects, certificates. Content PUT expects the full editable record, as supplied by the admin editor. Settings support partial updates.

Visibility/status fields require JSON booleans. Footer link edits preserve an existing hidden state when visibility is omitted. Invalid IDs return 400, missing records 404, duplicate records 409, oversized JSON 413. API responses use `Cache-Control: no-store` so refreshed content and private responses are not cached.

Uploads currently use `UPLOAD_DIR` on disk and validate MIME type, size, and file signatures. Deploy this backend with persistent disk storage; an ephemeral host requires an object-storage integration before deployment. Uploading a replacement does not remove the old file.

## Verification

`npm.cmd test` uses an isolated MongoDB memory server and does not modify the configured portfolio database. It covers authentication, protected mutations, saved public content, contact management, settings persistence, publication filtering, ordering and validation.
