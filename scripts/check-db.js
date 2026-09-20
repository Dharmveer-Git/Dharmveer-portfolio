import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { configureDatabaseDns } from '../server/config/dns.js'
import { databaseErrorHint } from '../server/config/database-error.js'

let client
const deadline = setTimeout(() => {
  console.error('MongoDB check timed out during connection/DNS lookup. Check DNS and Atlas Network Access.')
  process.exit(1)
}, 20_000)
try {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing')
  configureDatabaseDns()
  client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000, connectTimeoutMS: 5_000 })
  await client.db(process.env.MONGODB_DB_NAME || 'portfolio').command({ ping: 1 })
  console.log('MongoDB connection OK: database ping succeeded.')
} catch (error) {
  console.error(databaseErrorHint(error))
  process.exitCode = 1
} finally {
  await client?.close()
  clearTimeout(deadline)
}
