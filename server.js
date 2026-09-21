import 'dotenv/config'
import connectDB, { disconnectDB } from './server/config/db.js'
import { databaseErrorHint } from './server/config/database-error.js'
import { startServer } from './server/index.js'

async function main() {
  try {
    await connectDB()
  } catch (error) {
    console.error(databaseErrorHint(error))
    console.error('Run npm run db:check after correcting the connection settings.')
    process.exit(1)
  }
  await startServer()
}

main().catch(async (error) => {
  console.error('Application startup failed:', error.message)
  await disconnectDB().catch(() => {})
  process.exit(1)
})
