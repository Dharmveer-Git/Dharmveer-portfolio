import 'dotenv/config'
import { spawn, spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { configureDatabaseDns } from '../server/config/dns.js'

const dnsOptions = configureDatabaseDns()

const rootDirectory = process.cwd()
const viteCli = path.join(rootDirectory, 'node_modules', 'vite', 'bin', 'vite.js')
const apiOnly = process.argv.includes('--api-only')

const isPortInUse = (port) => new Promise((resolve) => {
  const probe = net.createConnection({ host: '127.0.0.1', port })
  probe.setTimeout(1_000)
  probe.once('connect', () => { probe.destroy(); resolve(true) })
  probe.once('timeout', () => { probe.destroy(); resolve(false) })
  probe.once('error', () => resolve(false))
})

const [apiRunning, frontendRunning] = await Promise.all([
  isPortInUse(Number(process.env.PORT) || 5001),
  apiOnly ? Promise.resolve(true) : isPortInUse(5173),
])

let mongoServer
let mongoUri = process.env.MONGODB_URI
const isAtlas = mongoUri && new URL(mongoUri).hostname.endsWith('.mongodb.net')
// An Atlas outage must never redirect writes into a different database.
const allowLocalFallback = !isAtlas && process.env.MONGODB_LOCAL_FALLBACK === 'true'

const canConnectToMongo = async (uri) => {
  let client

  try {
    client = new MongoClient(uri, {
      ...dnsOptions,
      connectTimeoutMS: 5_000,
      serverSelectionTimeoutMS: 5_000,
      maxPoolSize: 1,
    })

    await client.db(process.env.MONGODB_DB_NAME || 'portfolio').command({ ping: 1 })
    return true
  } catch {
    return false
  } finally {
    if (client) await client.close().catch(() => {})
  }
}

if (!apiRunning && mongoUri && allowLocalFallback && !(await canConnectToMongo(mongoUri))) {
  console.warn('Configured MongoDB is unavailable; using the persistent local development database.')
  mongoUri = ''
}

if (!apiRunning && !mongoUri) {
  const databasePath = path.join(rootDirectory, 'server', 'data')
  await mkdir(databasePath, { recursive: true })
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'portfolio', dbPath: databasePath, storageEngine: 'wiredTiger' },
  })
  mongoUri = mongoServer.getUri()
  console.log('Local development database is ready.')
}

const services = [
  {
    name: 'API',
    running: apiRunning,
    url: `http://127.0.0.1:${Number(process.env.PORT) || 5001}/api/health`,
    command: ['server.js'],
    env: { ...process.env, MONGODB_URI: mongoUri },
  },
  ...apiOnly ? [] : [{
    name: 'frontend',
    running: frontendRunning,
    url: 'http://127.0.0.1:5173',
    command: [viteCli, 'client', '--host', '127.0.0.1', '--strictPort'],
    env: process.env,
  }],
]

const children = services.flatMap((service) => {
  if (service.running) {
    console.log(`${service.name} is already running at ${service.url}`)
    return []
  }
  console.log(`Starting ${service.name} at ${service.url}`)
  return [spawn(process.execPath, service.command, {
    cwd: rootDirectory,
    env: service.env,
    stdio: 'inherit',
  })]
})

if (children.length === 0) {
  console.log('All development services are already running.')
  process.exit(0)
}

let stopping = false
const stop = async (exitCode = 0) => {
  if (stopping) return
  stopping = true
  for (const child of children) {
    if (child.killed || !child.pid) continue
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
      child.kill('SIGTERM')
    }
  }
  if (mongoServer) await mongoServer.stop()
  process.exit(exitCode)
}

for (const child of children) {
  child.on('error', (error) => {
    console.error(`Development process failed to start: ${error.message}`)
    void stop(1)
  })
  child.on('exit', (code, signal) => {
    if (!stopping && code !== 0) {
      console.error(`Development process exited (${signal || code}).`)
      void stop(code || 1)
    }
  })
}

process.on('SIGINT', () => { void stop() })
process.on('SIGTERM', () => { void stop() })
