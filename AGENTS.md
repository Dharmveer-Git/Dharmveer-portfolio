# Code Agent Instructions

## Current change restriction

- For design, styling, layout, responsiveness, icon, and visual-polish requests, do not modify API routes, controllers, database models, MongoDB records, seed data, authentication behavior, environment variables, or persisted admin content.
- Preserve existing API contracts and saved data exactly unless the user explicitly requests a backend or data change in a later message.
- Prefer changes limited to React presentation components and CSS for the current design work.

## Admin-managed portfolio content

The portfolio must be content-managed. Do not hardcode editable portfolio content in React components or local data files when it belongs in the admin-managed data described below. Public pages must read this content from the backend, and saved admin changes must appear on the public portfolio without requiring a code change or rebuild.

### Authentication and access

- Support exactly one Super Admin account.
- Only an authenticated Super Admin may access admin routes, the dashboard, content mutations, uploads, or contact-message management.
- Do not add public registration, additional admin creation, roles, or invitations.
- Keep credentials and JWT/session secrets in environment variables. Never commit real credentials.
- Enforce authorization on the server for every protected operation; client-side route guards are not sufficient.

### Admin dashboard navigation

Use the following sidebar order and labels consistently. Each content-management item must open its own focused dashboard page; do not combine unrelated sections into a generic form.

```text
Admin Dashboard
|
|-- Overview
|-- Hero
|-- About
|-- Skills
|-- Projects
|-- Experience
|-- Education
|-- Certificates
|-- Resume
|-- Social Links
|-- Contact Messages
|-- SEO Settings
|-- Website Settings
`-- Logout
```

- `Overview` shows useful summary counts and recent contact-message activity.
- `Website Settings` contains navbar/footer editing, section visibility, and the default theme control.
- `Logout` must clear the authenticated session/token and redirect to the admin login page.
- Clearly indicate the active navigation item.
- Keep the sidebar usable on mobile through an accessible open/close control, and close it after navigation when appropriate.
- Every dashboard page and route except the login page must be protected by Super Admin authentication.

### Editable content

The Super Admin must be able to manage the following from the dashboard:

- Hero: name, job title, description, profile image, and the `Hire Me` button text.
- About: about text, photo, and profile/details fields.
- Skills: add, edit, delete, and reorder skills.
- Projects: add, edit, delete, and reorder projects. A project supports screenshot/image, title, description, tech stack, GitHub URL, Live Demo URL, and featured status.
- Experience: add, edit, and delete entries containing company, role, date/date range, and description.
- Education: add, edit, and delete entries containing degree, college/institution, year/date range, and details.
- Certificates: add, edit, delete, and reorder certificates. A certificate supports an image or PDF, title, organization, and URL.
- Social links: edit GitHub, LinkedIn, YouTube, LeetCode, HackerRank, and email links.
- Resume: upload or replace the existing resume. The public `Download Resume` action must automatically use the current saved resume URL.
- Contact messages: view messages, view full message details, mark read/unread, and delete.
- Navbar and footer: edit displayed logo/name, navigation links, and copyright text.
- SEO: edit page title, meta description, keywords, and Open Graph image. Apply saved SEO values to the public page metadata.
- Theme: choose the public site's default light or dark theme. A visitor preference may override the default after the visitor explicitly changes it.

### Public footer structure

Implement the public footer with this information hierarchy:

```text
----------------------------------------------------------------
| Dharamveer Kumar        | Quick Links   | Professional       |
| Full Stack Developer    | Home          | GitHub             |
| Short professional line | About         | LinkedIn           |
|                         | Projects      | Indeed             |
|                         | Contact       | Upwork              |
|                         |               | Turing              |
----------------------------------------------------------------
| Email        WhatsApp        YouTube        Facebook          |
----------------------------------------------------------------
| © 2026 Dharamveer Kumar | Privacy | Back to Top ↑            |
----------------------------------------------------------------
```

- Treat the displayed values as initial/default content only. The admin must be able to edit the name, job title, short professional line, group headings, link labels, link targets, copyright text, and privacy link from `Website Settings` or `Social Links`, as appropriate.
- `Quick Links` contains Home, About, Projects, and Contact by default. Automatically omit links to sections hidden through Website Settings.
- `Professional` contains GitHub, LinkedIn, Indeed, Upwork, and Turing by default.
- The secondary contact/social row contains Email, WhatsApp, YouTube, and Facebook by default.
- External links must open safely with `target="_blank"` and `rel="noopener noreferrer"`; email and WhatsApp must use valid `mailto:` and `https://wa.me/` targets.
- `Back to Top` must smoothly return focus and scroll position to the top without reloading the page.
- Do not hardcode `2026` as a permanent value. Support editable copyright text or derive the current year automatically according to the saved Website Settings choice.
- On smaller screens, stack the footer columns and rows in a clear reading order without horizontal overflow. Preserve visible keyboard focus, semantic headings/navigation, and accessible link labels.

### Footer Settings

Provide a dedicated `Footer Settings` panel under `Website Settings` with these controls in this order:

```text
Footer Settings
|-- Developer Name
|-- Short Description
|-- Footer Logo
|-- Email
|-- WhatsApp
|-- GitHub
|-- LinkedIn
|-- Indeed
|-- Upwork
|-- Turing
|-- Facebook
|-- YouTube
|-- LeetCode
|-- HackerRank
|-- Copyright Text
|-- Show/Hide Social Links
`-- Show/Hide Footer Sections
```

- Persist every footer setting in the database and render the public footer from the saved settings; do not keep these values only in browser state.
- `Footer Logo` must support upload, preview, replacement, accessible alt text, and the same server-side file validation used by other image uploads.
- Normalize and validate email, WhatsApp number/link, and all external profile URLs before saving.
- `Show/Hide Social Links` must allow individual control of each configured social or contact link, not only one global toggle. Empty or disabled links must not render.
- `Show/Hide Footer Sections` must allow independent control of the identity/description block, Quick Links, Professional links, social/contact row, copyright text, Privacy link, and Back to Top control.
- Hiding a footer link or section must preserve its saved values.
- The editor must show a clear preview or enough contextual labels for the admin to understand where each field appears.
- Updating Footer Settings must update the public footer after refresh without a code change or rebuild.

### Section controls

- The admin must be able to show or hide each public portfolio section independently.
- Hidden sections must not render on the public site and their navbar links must not be shown.
- Hiding a section must not delete its content.

### Ordering

- Projects, skills, and certificates must support drag-and-drop reordering in the dashboard.
- Persist an explicit order value in the database; do not rely on creation time or array order only.
- Public API responses and public UI rendering must respect the persisted order.
- Reordering must remain usable with keyboard-accessible controls or a non-drag fallback.

### Media and uploads

- Profile/about images, project images, certificate images/PDFs, resume files, and the Open Graph image must be uploadable and replaceable from the dashboard.
- Validate file type and size on the server as well as the client. Generate safe unique filenames and never trust a user-supplied path.
- Show the existing asset while editing and provide upload progress/error feedback where practical.
- Replacing an asset must update all public references to the new saved URL. Do not silently remove an old asset until the new upload and database update succeed.
- Use deployment-appropriate persistent object storage when the server filesystem is ephemeral.

### Data and API behavior

- Store all admin-managed values in MongoDB through the existing backend API and models.
- Public read endpoints may expose only published portfolio content. All mutations require Super Admin authentication.
- Validate and normalize request data on the server. Validate external URLs and reject unsafe URL schemes.
- Preserve existing data when introducing new fields by supplying safe schema defaults and migration/backfill behavior where needed.
- Return useful loading, empty, success, and error states in both the dashboard and public portfolio.

### Definition of done

A feature is not complete unless:

1. Its database model, validation, API/controller behavior, and protected admin UI are implemented.
2. The public portfolio consumes and displays the saved value correctly.
3. Refreshing the dashboard and public page preserves the change.
4. Unauthorized users cannot perform the operation.
5. Relevant lint/build/tests pass, and the feature has been checked for responsive and accessible behavior.
