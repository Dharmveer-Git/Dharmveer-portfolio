import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import multer from 'multer'
import path from 'node:path'
import adminRoutes from './routes/adminRoutes.js'
import apiRoutes from './routes/apiRoutes.js'

export function createApp() {
  const app = express()
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.disable('x-powered-by')
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      const error = new Error('Origin is not allowed by CORS.')
      error.status = 403
      return callback(error)
    },
    credentials: false,
  }))
  app.use(express.json({ limit: '32kb' }))
  app.use('/api', (request, response, next) => {
    response.set('Cache-Control', 'no-store')
    if (request.body !== undefined && (!request.body || typeof request.body !== 'object' || Array.isArray(request.body))) {
      return response.status(400).json({ message: 'Request body must be a JSON object.' })
    }
    return next()
  })

  app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'server/uploads')))
  app.use('/uploads', express.static(path.resolve('client/public/uploads')))

  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))
  app.use('/api/admin', adminRoutes)
  app.use('/api', apiRoutes)

  app.use('/api', (_request, response) => {
    response.status(404).json({ message: 'API endpoint not found.' })
  })

  if (process.env.NODE_ENV === 'production') {
    const clientDirectory = path.resolve('client/dist')
    app.use(express.static(clientDirectory, { index: false, maxAge: '1d' }))
    app.use((request, response, next) => {
      if (request.method !== 'GET' || !request.accepts('html')) return next()
      return response.sendFile(path.join(clientDirectory, 'index.html'))
    })
  }

  app.use((_request, response) => response.status(404).json({ message: 'Not found.' }))

  app.use((error, _request, response, _next) => {
    if (error?.type === 'entity.too.large') return response.status(413).json({ message: 'Request body must be 32 KB or smaller.' })
    if (error?.code === 11000) return response.status(409).json({ message: 'This record already exists.' })
    if (error?.status === 403) return response.status(403).json({ message: error.message })
    if (error?.type === 'entity.parse.failed') {
      return response.status(400).json({ message: 'Request body must contain valid JSON.' })
    }
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'File must be 10 MB or smaller.'
        : 'Only JPG, PNG, WebP, and PDF files are allowed.'
      return response.status(400).json({ message })
    }
    console.error(error)
    return response.status(500).json({ message: 'Internal server error.' })
  })

  return app
}
