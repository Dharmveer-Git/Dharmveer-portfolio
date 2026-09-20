import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Test environment
process.env.JWT_SECRET =
  "test-secret-that-is-at-least-thirty-two-characters";

process.env.ADMIN_EMAIL = "admin@example.test";
process.env.ADMIN_PASSWORD = "SecurePassword!123";
process.env.CLIENT_URL = "http://localhost:5173";

// Load application and services
const { createApp } = await import("./app.js");

const {
  authenticateAdmin,
  ensureSuperAdmin,
  signAdminToken,
} = await import("./services/adminAuthService.js");

const { ensureInitialContent } =
  await import("./services/seedService.js");

const { ensureSiteSettings } =
  await import("./services/siteSettingsService.js");

let database;
let server;
let baseUrl;

// Start test database and server
before(async () => {
  database = await MongoMemoryServer.create();

  await mongoose.connect(database.getUri(), {
    dbName: "portfolio-auth-test",
  });

  await Promise.all([
    ensureSuperAdmin(),
    ensureSiteSettings(),
    ensureInitialContent(),
  ]);

  server = createApp().listen(0, "127.0.0.1");

  await new Promise((resolve) =>
    server.once("listening", resolve)
  );

  const { port } = server.address();

  baseUrl = `http://127.0.0.1:${port}`;
});

// Stop test server and database
after(async () => {
  await new Promise((resolve) =>
    server.close(resolve)
  );

  await mongoose.disconnect();
  await database.stop();
});

// Invalid login
test("rejects invalid credentials", async () => {
  const response = await fetch(
    `${baseUrl}/api/admin/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: "incorrect-password",
      }),
    }
  );

  assert.equal(response.status, 401);
});

test("allows login after more than ten failed attempts", async () => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: "incorrect-password" }),
    });
    assert.equal(response.status, 401);
  }
  const response = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  assert.equal(response.status, 200);
  assert.ok((await response.json()).token);
});

// Successful login and protected routes
test("logs in and authorizes protected admin routes", async () => {
  const loginResponse = await fetch(
    `${baseUrl}/api/admin/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      }),
    }
  );

  assert.equal(loginResponse.status, 200);

  const { token, admin } = await loginResponse.json();

  assert.ok(token);
  assert.equal(admin.role, "super-admin");

  const meResponse = await fetch(
    `${baseUrl}/api/admin/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(meResponse.status, 200);

  const overviewResponse = await fetch(
    `${baseUrl}/api/admin/overview`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(overviewResponse.status, 200);
  assert.equal(
    (await overviewResponse.json()).database,
    "connected"
  );
});

// Public portfolio
test("serves saved portfolio content and settings publicly", async () => {
  const response = await fetch(
    `${baseUrl}/api/portfolio`
  );

  assert.equal(response.status, 200);

  const payload = await response.json();

  assert.equal(
    payload.content.profile[0].title,
    "Dharmveer Kumar"
  );

  assert.ok(payload.content.skills.length > 0);
  assert.equal(
    payload.settings.defaultTheme,
    "dark"
  );
});

// Content authorization and CRUD
test("protects mutations and supports content management", async () => {
  const unauthorized = await fetch(
    `${baseUrl}/api/skills`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "TypeScript",
      }),
    }
  );

  assert.equal(unauthorized.status, 401);

  const loginResponse = await fetch(
    `${baseUrl}/api/admin/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      }),
    }
  );

  const { token } = await loginResponse.json();

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const createResponse = await fetch(
    `${baseUrl}/api/skills`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "TypeScript",
        order: 99,
      }),
    }
  );

  assert.equal(createResponse.status, 201);

  const created = await createResponse.json();

  const publicItems = await (
    await fetch(`${baseUrl}/api/skills`)
  ).json();

  assert.ok(
    publicItems.some(
      (item) => item._id === created._id
    )
  );

  const deleteResponse = await fetch(
    `${baseUrl}/api/skills/${created._id}`,
    {
      method: "DELETE",
      headers,
    }
  );

  assert.equal(deleteResponse.status, 200);
});

// Contact messages
test("accepts contact messages and restricts message management", async () => {
  const createResponse = await fetch(
    `${baseUrl}/api/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Visitor",
        email: "visitor@example.test",
        subject: "Portfolio enquiry",
        message: "Testing the contact workflow.",
      }),
    }
  );

  assert.equal(createResponse.status, 201);

  assert.equal(
    (await fetch(`${baseUrl}/api/messages`)).status,
    401
  );

  const loginResponse = await fetch(
    `${baseUrl}/api/admin/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      }),
    }
  );

  const { token } = await loginResponse.json();

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const messages = await (
    await fetch(`${baseUrl}/api/messages`, {
      headers,
    })
  ).json();

  assert.equal(messages.length, 1);

  const readResponse = await fetch(
    `${baseUrl}/api/messages/${messages[0]._id}/read`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        read: true,
      }),
    }
  );

  assert.equal(
    (await readResponse.json()).read,
    true
  );
});

// Environment credential rotation
test("synchronizes the single admin with rotated environment credentials", async () => {
  const originalPassword = process.env.ADMIN_PASSWORD;

  process.env.ADMIN_PASSWORD =
    "RotatedPassword!456";

  await ensureSuperAdmin();

  assert.ok(
    await authenticateAdmin(
      process.env.ADMIN_EMAIL,
      process.env.ADMIN_PASSWORD
    )
  );

  assert.equal(
    await authenticateAdmin(
      process.env.ADMIN_EMAIL,
      originalPassword
    ),
    null
  );

  process.env.ADMIN_PASSWORD = originalPassword;

  await ensureSuperAdmin();
});


test('repairs a legacy admin without passwordHash using configured bootstrap credentials', async () => {
  const { default: Admin } = await import('./models/Admin.js');
  const original = await Admin.findOne().select('+passwordHash');
  await Admin.collection.updateOne({ _id: original._id }, {
    $unset: { passwordHash: '', email: '', singletonKey: '' },
    $set: { password: 'legacy-value', credentialsManaged: false },
  });
  assert.equal(await authenticateAdmin(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD), null);
  const repaired = await ensureSuperAdmin();
  assert.equal(repaired.id, original.id);
  assert.equal(await Admin.countDocuments(), 1);
  assert.ok(await authenticateAdmin(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD));
  assert.equal(await authenticateAdmin(process.env.ADMIN_EMAIL, 'wrong-password'), null);
  await Admin.collection.updateOne({ _id: original._id }, { $unset: { password: '' } });
});

test('missing managed password hashes fail authentication without resetting credentials or crashing', async () => {
  const { default: Admin } = await import('./models/Admin.js');
  const original = await Admin.findOne().select('+passwordHash');
  const token = signAdminToken(original);
  try {
    await Admin.collection.updateOne({ _id: original._id }, { $unset: { passwordHash: '' }, $set: { credentialsManaged: true } });
    await ensureSuperAdmin();
    assert.equal(await authenticateAdmin(original.email, process.env.ADMIN_PASSWORD), null);
    const login = await fetch(baseUrl + '/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({email: original.email, password: process.env.ADMIN_PASSWORD}),
    });
    assert.equal(login.status, 401);
    const update = await fetch(baseUrl + '/api/admin/account', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({email: original.email, currentPassword: process.env.ADMIN_PASSWORD}),
    });
    assert.equal(update.status, 403);
    assert.equal((await Admin.findById(original._id).select('+passwordHash')).passwordHash, undefined);
  } finally {
    await Admin.collection.updateOne({ _id: original._id }, { $set: { passwordHash: original.passwordHash, credentialsManaged: original.credentialsManaged } });
  }
});

// Generate authenticated admin headers
async function adminHeaders() {
  const admin = await authenticateAdmin(
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD
  );

  return {
    Authorization: `Bearer ${signAdminToken(admin)}`,
    "Content-Type": "application/json",
  };
}

// Message details and validation
test("message details and strict read status are protected and persisted", async () => {
  const headers = await adminHeaders();

  const messages = await (
    await fetch(`${baseUrl}/api/messages`, {
      headers,
    })
  ).json();

  const url =
    `${baseUrl}/api/messages/${messages[0]._id}`;

  assert.equal(
    (await fetch(url)).status,
    401
  );

  assert.equal(
    (await fetch(url, { headers })).status,
    200
  );

  assert.equal(
    (
      await fetch(`${url}/read`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          read: "false",
        }),
      })
    ).status,
    400
  );

  assert.equal(
    (
      await fetch(`${url}/read`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          read: false,
        }),
      })
    ).status,
    200
  );

  assert.equal(
    (
      await (
        await fetch(url, { headers })
      ).json()
    ).read,
    false
  );

  assert.equal(
    (
      await fetch(
        `${baseUrl}/api/messages/invalid`,
        { headers }
      )
    ).status,
    400
  );
});

// Footer partial updates
test("footer partial edits preserve visibility and settings survive a public refresh", async () => {
  const headers = await adminHeaders();

  const save = (body) =>
    fetch(`${baseUrl}/api/settings`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

  assert.equal(
    (
      await save({
        footer: {
          links: {
            github: {
              url: "https://github.com/example",
              visible: false,
            },
          },
        },
      })
    ).status,
    200
  );

  assert.equal(
    (
      await save({
        footer: {
          links: {
            github: {
              label: "Code",
            },
          },
        },
        pageTitle: "Saved portfolio",
      })
    ).status,
    200
  );

  const settings = await (
    await fetch(`${baseUrl}/api/settings`)
  ).json();

  assert.equal(
    settings.footer.links.github.visible,
    false
  );

  assert.equal(
    settings.footer.links.github.url,
    "https://github.com/example"
  );

  assert.equal(
    settings.pageTitle,
    "Saved portfolio"
  );

  assert.equal(
    (
      await save({
        sections: {
          skills: "false",
        },
      })
    ).status,
    400
  );

  assert.equal(
    (await save({ footer: null })).status,
    400
  );

  assert.equal(
    (
      await save({
        ogImage: "/\\evil.example/image.png",
      })
    ).status,
    400
  );
});

// Admin overview
test("overview exposes resource counts and recent activity only to the admin", async () => {
  assert.equal(
    (await fetch(`${baseUrl}/api/admin/overview`))
      .status,
    401
  );

  const response = await fetch(
    `${baseUrl}/api/admin/overview`,
    {
      headers: await adminHeaders(),
    }
  );

  const data = await response.json();

  assert.ok(data.counts.skills > 0);
  assert.ok(data.recentMessages.length > 0);

  assert.equal(
    response.headers.get("cache-control"),
    "no-store"
  );
});

// Request body size
test("rejects oversized JSON with a useful client error", async () => {
  const response = await fetch(
    `${baseUrl}/api/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "x".repeat(33000),
      }),
    }
  );

  assert.equal(response.status, 413);
});

// Authentication protection
test("all content resources and management operations require authentication", async () => {
  const id = "507f1f77bcf86cd799439011";

  for (const resource of [
    "profile",
    "about",
    "skills",
    "projects",
    "experience",
    "education",
    "certificates",
    "services",
    "socials",
  ]) {
    for (const [
      method,
      endpoint,
    ] of [
      ["POST", `/${resource}`],
      ["PUT", `/${resource}/${id}`],
      ["DELETE", `/${resource}/${id}`],
      ["GET", `/admin/content/${resource}`],
    ]) {
      assert.equal(
        (
          await fetch(`${baseUrl}/api${endpoint}`, {
            method,
          })
        ).status,
        401,
        `${method} ${endpoint}`
      );
    }
  }

  for (const [
    method,
    endpoint,
  ] of [
    ["PUT", "/settings"],
    ["POST", "/upload"],
    ["PATCH", "/skills/reorder"],
    ["DELETE", `/messages/${id}`],
    ["PATCH", `/messages/${id}/read`],
  ]) {
    assert.equal(
      (
        await fetch(`${baseUrl}/api${endpoint}`, {
          method,
        })
      ).status,
      401
    );
  }
});

// Project CRUD, ordering and publication
test("project edits, publication status and explicit ordering persist", async () => {
  const headers = await adminHeaders();

  const create = async (title) => {
    const response = await fetch(
      `${baseUrl}/api/projects`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
        }),
      }
    );

    assert.equal(response.status, 201);

    return response.json();
  };

  const first = await create("First project");
  const second = await create("Second project");

  const reordered = await fetch(
    `${baseUrl}/api/projects/reorder`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        ids: [second._id, first._id],
      }),
    }
  );

  assert.equal(reordered.status, 200);

  const projects = await (
    await fetch(`${baseUrl}/api/projects`)
  ).json();

  assert.deepEqual(
    projects.map((item) => item._id),
    [second._id, first._id]
  );

  const update = await fetch(
    `${baseUrl}/api/projects/${first._id}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        ...first,
        active: false,
        title: "Draft project",
      }),
    }
  );

  assert.equal(update.status, 200);

  assert.equal(
    (
      await (
        await fetch(`${baseUrl}/api/projects`)
      ).json()
    ).length,
    1
  );

  const drafts = await (
    await fetch(
      `${baseUrl}/api/admin/content/projects`,
      { headers }
    )
  ).json();

  assert.ok(
    drafts.some(
      (item) =>
        item.title === "Draft project" &&
        !item.active
    )
  );

  for (const item of [first, second]) {
    assert.equal(
      (
        await fetch(
          `${baseUrl}/api/projects/${item._id}`,
          {
            method: "DELETE",
            headers,
          }
        )
      ).status,
      200
    );
  }
});


test('content CRUD supports single reads and partial updates without losing saved fields', async () => {
  const headers = await adminHeaders();
  const request = (path, method = 'GET', body, authorized = true) => fetch(baseUrl + '/api/' + path, {
    method, headers: authorized ? headers : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const path = method === 'POST' ? 'projects' : 'projects/000000000000000000000001';
    assert.equal((await request(path, method, {title:'Unauthorized'}, false)).status, 401);
  }
  const created = await request('projects', 'POST', {title:'CRUD test', description:'Keep this', tags:['Node'], meta:{problem:'Keep problem', solution:'Old'}});
  assert.equal(created.status, 201);
  const item = await created.json();
  const path = 'projects/' + item._id;
  assert.equal((await request(path)).status, 200);
  const patched = await request(path, 'PATCH', {featured:true, meta:{solution:'New'}});
  assert.equal(patched.status, 200);
  const saved = await patched.json();
  assert.equal(saved.description, 'Keep this');
  assert.deepEqual(saved.tags, ['Node']);
  assert.equal(saved.meta.problem, 'Keep problem');
  assert.equal(saved.meta.solution, 'New');
  assert.equal((await (await request(path)).json()).featured, true);
  for (const body of [{}, {title:''}, {active:'false'}, {image:'javascript:alert(1)'}, {resource:'skills'}, {meta:{'$set':'bad'}}, {title:null}]) {
    assert.equal((await request(path, 'PATCH', body)).status, 400);
  }
  assert.equal((await request('projects/not-an-id')).status, 400);
  assert.equal((await request('projects/not-an-id', 'PATCH', {title:'test'})).status, 400);
  assert.equal((await request('projects/000000000000000000000001', 'PATCH', {title:'test'})).status, 404);
  assert.equal((await request('unknown/' + item._id)).status, 404);
  assert.equal((await request(path, 'PUT', {...saved, title:'Replaced'})).status, 200);
  assert.equal((await (await request(path)).json()).title, 'Replaced');
  assert.equal((await request(path, 'PATCH', {active:false})).status, 200);
  assert.equal((await request(path)).status, 404);
  const adminItems = await (await request('admin/content/projects')).json();
  assert.ok(adminItems.some(record => record._id === item._id && record.active === false));
  assert.equal((await request(path, 'DELETE')).status, 200);
  assert.equal((await request(path, 'DELETE')).status, 404);
});

test('account updates require current password, revoke sessions, and survive startup', async () => {
  const headers = await adminHeaders()
  const account = { email: 'updated@example.test', currentPassword: process.env.ADMIN_PASSWORD, newPassword: 'UpdatedPassword!789' }
  assert.equal((await fetch(`${baseUrl}/api/admin/account`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account) })).status, 401)
  assert.equal((await fetch(`${baseUrl}/api/admin/account`, { method: 'PUT', headers, body: JSON.stringify({ ...account, currentPassword: 'wrong' }) })).status, 403)
  assert.equal((await fetch(`${baseUrl}/api/admin/account`, { method: 'PUT', headers, body: JSON.stringify({ ...account, newPassword: 'short' }) })).status, 400)
  assert.equal((await fetch(`${baseUrl}/api/admin/account`, { method: 'PUT', headers, body: JSON.stringify(account) })).status, 200)
  assert.equal((await fetch(`${baseUrl}/api/admin/me`, { headers })).status, 401)
  await ensureSuperAdmin()
  const admin = await authenticateAdmin(account.email, account.newPassword)
  assert.ok(admin)
  assert.equal(await authenticateAdmin(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD), null)
  const newHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${signAdminToken(admin)}` }
  assert.equal((await fetch(`${baseUrl}/api/admin/me`, { headers: newHeaders })).status, 200)
  assert.equal((await fetch(`${baseUrl}/api/admin/account`, { method: 'PUT', headers: newHeaders, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, currentPassword: account.newPassword, newPassword: '' }) })).status, 200)
  await ensureSuperAdmin()
  assert.ok(await authenticateAdmin(process.env.ADMIN_EMAIL, account.newPassword))
})
