# Postman API testing

Import `Portfolio.postman_collection.json` into Postman.

1. Start the API from `portfolio` with `npm run server:dev`. The configured MongoDB database must be reachable before the API listens on port 5001.
2. Set collection variables `baseUrl` to `http://localhost:5001`, and `adminEmail` / `adminPassword` to your current admin credentials. Keep credentials local and do not export them.
3. Send **Health**, then **Login - saves token**. Login automatically saves the bearer token for authenticated requests.
4. Run **Project CRUD - run in order**. It creates its own test project, checks GET/PUT/PATCH, then deletes that test project. Never replace `projectId` with an existing portfolio record.

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | `/api/:resource` | List active public records |
| GET | `/api/:resource/:id` | Read one active record; hidden/missing records return 404 |
| POST | `/api/:resource` | Create a record (admin token required); returns 201 |
| PUT | `/api/:resource/:id` | Replace editable content; include title and all fields to keep |
| PATCH | `/api/:resource/:id` | Update only provided fields; preserves omitted fields and merges provided meta keys |
| DELETE | `/api/:resource/:id` | Delete a record (admin token required) |
| GET | `/api/admin/content/:resource` | Admin list including hidden records |
| PATCH | `/api/:resource/reorder` | Reorder skills, projects or certificates using `{ "ids": ["id1", "id2"] }` |

Resources: `profile`, `about`, `skills`, `projects`, `experience`, `education`, `certificates`, `services`, `socials`.

All POST/PUT/PATCH/DELETE content operations require `Authorization: Bearer <token>`. Profile and about are singleton records: update existing records; deletion is disabled. PUT retains its existing replacement behavior, so use PATCH for one-field edits. PATCH rejects empty payloads, unsupported fields, nulls, unsafe URLs and invalid status booleans. Nested meta keys supplied in PATCH merge into existing meta.

Example POST `/api/projects` or PUT `/api/projects/:id` body:

```json
{
  "title": "My project",
  "description": "Project description",
  "tags": ["React", "Node.js"],
  "githubUrl": "https://github.com/example/project",
  "active": true
}
```

Example PATCH `/api/projects/:id` body:

```json
{ "description": "Updated description", "featured": true }
```

Expected statuses: 200 success, 201 created, 400 invalid input/ID, 401 missing/invalid authentication, 404 missing resource/record, 409 duplicate singleton.

If Postman reports ECONNREFUSED, the backend is not listening; check the server terminal. A MongoDB Atlas TLS or connection error must be resolved before database-backed requests can run. The automated integration tests use an isolated temporary database and do not validate Atlas connectivity. Run them with `npm test`.
