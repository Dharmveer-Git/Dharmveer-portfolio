import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import net from 'node:net'
import { MongoMemoryServer } from 'mongodb-memory-server'

const db = await MongoMemoryServer.create()
const probe = net.createServer()
probe.listen(0, '127.0.0.1')
await once(probe, 'listening')
const port = probe.address().port
await new Promise(resolve => probe.close(resolve))
const entryArgs = process.argv.includes('--require') ? ['-e', "require('./server.js')"] : ['server.js']
const child = spawn(process.execPath, entryArgs, {
  env: { ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port),
    MONGODB_URI: db.getUri(), MONGODB_DB_NAME: 'production-smoke',
    JWT_SECRET: 'isolated-production-smoke-secret-32-characters',
    ADMIN_EMAIL: 'smoke@example.test', ADMIN_PASSWORD: 'Smoke-test-password-123',
    CLIENT_URL: `http://127.0.0.1:${port}` },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let logs = ''
child.stdout.on('data', data => { logs += data })
child.stderr.on('data', data => { logs += data })
try {
  const base = `http://127.0.0.1:${port}`
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error('Production server exited before ready: ' + logs)
    try { ready = (await fetch(`${base}/api/health`)).ok } catch {}
    if (ready) break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(ready, 'Production server must start')
  for (const path of ['/', '/admin/login', '/admin/projects']) {
    const response = await fetch(base + path, { headers: { Accept: 'text/html' } })
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.match(html, /id="root"/)
    const asset = html.match(/src="([^"]+\.js)"/)
    assert.ok(asset, 'HTML must reference built JavaScript')
    assert.equal((await fetch(base + asset[1])).status, 200)
  }
  assert.equal((await fetch(`${base}/api/profile`)).status, 200)
  assert.equal((await fetch(`${base}/api/admin/me`)).status, 401)
  const login = await fetch(`${base}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ email: 'smoke@example.test', password: 'Smoke-test-password-123' }) })
  assert.equal(login.status, 200)
  console.log('Production smoke passed: server.js startup, MongoDB, SPA routes, built assets, public API, protected API, admin login and CORS.')
} finally {
  child.kill()
  if (child.exitCode === null) await once(child, 'exit')
  await db.stop()
}
