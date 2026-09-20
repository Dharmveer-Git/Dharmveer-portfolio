import 'dotenv/config'
import connectDB from './server/config/db.js'
import { databaseErrorHint } from './server/config/database-error.js'

try {
  await connectDB()
} catch (error) {
  console.error(databaseErrorHint(error))
  console.error('Run npm run db:check after correcting the connection settings.')
  process.exit(1)
}
await import('./server/index.js')
