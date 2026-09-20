import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

const TOKEN_ISSUER = 'portfolio-api'
const TOKEN_AUDIENCE = 'portfolio-admin'

export const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

function requireAuthEnvironment() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL)
  const password = process.env.ADMIN_PASSWORD || ''
  const jwtSecret = process.env.JWT_SECRET || ''

  if (!email || !email.includes('@')) throw new Error('ADMIN_EMAIL must be a valid email address.')
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must contain at least 8 characters.')
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.')

  return { email, password, jwtSecret }
}

export async function passwordMatches(password, passwordHash) {
  if (typeof password !== 'string' || typeof passwordHash !== 'string' || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(passwordHash)) return false
  return bcrypt.compare(password, passwordHash)
}

export async function ensureSuperAdmin() {
  const { email, password } = requireAuthEnvironment()
  const admins = await Admin.find().select('+passwordHash').limit(2)

  if (admins.length > 1) {
    throw new Error('Only one Super Admin account is allowed.')
  }

  if (admins.length === 1) {
    const admin = admins[0]
    if (admin.credentialsManaged) return admin
    let changed = false

    if (admin.email !== email) {
      admin.email = email
      changed = true
    }
    if (!admin.passwordHash || !(await bcrypt.compare(password, admin.passwordHash))) {
      admin.passwordHash = await bcrypt.hash(password, 12)
      changed = true
    }

    return changed ? admin.save() : admin
  }

  const passwordHash = await bcrypt.hash(password, 12)
  return Admin.create({ email, passwordHash })
}

export async function authenticateAdmin(email, password) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || typeof password !== 'string') return null

  const admin = await Admin.findOne({ email: normalizedEmail }).select('+passwordHash')
  if (!admin || !(await passwordMatches(password, admin.passwordHash))) return null
  return admin
}

export function signAdminToken(admin) {
  const { jwtSecret } = requireAuthEnvironment()
  return jwt.sign(
    { sub: admin.id, role: 'super-admin', version: admin.sessionVersion || 0 },
    jwtSecret,
    { expiresIn: '8h', issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE },
  )
}

export function verifyAdminToken(token) {
  const { jwtSecret } = requireAuthEnvironment()
  return jwt.verify(token, jwtSecret, {
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  })
}
