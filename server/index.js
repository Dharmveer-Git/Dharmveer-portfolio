import { createApp } from './app.js'
import { disconnectDB } from './config/db.js'
import { ensureSuperAdmin } from './services/adminAuthService.js'
import { ensureInitialContent } from './services/seedService.js'
import { ensureSiteSettings } from './services/siteSettingsService.js'

await Promise.all([ensureSuperAdmin(), ensureSiteSettings(), ensureInitialContent()])

const port = Number(process.env.PORT) || 5001
const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1')
const server = createApp().listen(port, host, () => {
  console.log(`API listening at http://${host}:${port}`)
})

let closing = false
const close = (signal) => {
  if (closing) return
  closing = true
  console.log(`${signal} received; closing API server.`)
  const forceExit = setTimeout(() => process.exit(1), 10_000)
  forceExit.unref()
  server.close(async () => {
    await disconnectDB()
    process.exit(0)
  })
}

process.on('SIGINT', () => close('SIGINT'))
process.on('SIGTERM', () => close('SIGTERM'))
