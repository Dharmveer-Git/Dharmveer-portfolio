import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'
import mongoose from 'mongoose'
import ContentItem from '../models/ContentItem.js'
import Message from '../models/Message.js'
import { authenticateAdmin, passwordMatches, signAdminToken } from '../services/adminAuthService.js'

const publicAdmin = (admin) => ({
  id: admin.id,
  email: admin.email,
  role: 'super-admin',
})

export async function login(request, response, next) {
  try {
    const { email, password } = request.body || {}
    if (typeof email !== 'string' || typeof password !== 'string') {
      return response.status(400).json({ message: 'Email and password are required.' })
    }

    const admin = await authenticateAdmin(email, password)
    if (!admin) return response.status(401).json({ message: 'Invalid email or password.' })

    return response.json({ token: signAdminToken(admin), admin: publicAdmin(admin) })
  } catch (error) {
    return next(error)
  }
}

export function me(request, response) {
  return response.json({ admin: publicAdmin(request.admin) })
}

export async function overview(_request, response, next) {
  try {
    const [content, messages, unread, counts, recentMessages] = await Promise.all([
      ContentItem.countDocuments(),
      Message.countDocuments(),
      Message.countDocuments({ read: false }),
      ContentItem.aggregate([{ $group: { _id: '$resource', count: { $sum: 1 } } }]),
      Message.find().sort({ createdAt: -1 }).limit(5).select('name subject read createdAt').lean(),
    ])
    const database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    return response.json({ content, messages, unread, database, counts: Object.fromEntries(counts.map(({ _id, count }) => [_id, count])), recentMessages })
  } catch (error) {
    return next(error)
  }
}

export async function updateAccount(request, response, next) {
  try {
    const { currentPassword, email, newPassword } = request.body || {}
    if (typeof currentPassword !== 'string' || typeof email !== 'string' || (newPassword !== undefined && typeof newPassword !== 'string')) {
      return response.status(400).json({ message: 'Enter your current password and a valid email.' })
    }
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      return response.status(400).json({ message: 'Enter a valid email address.' })
    }
    if (newPassword && (newPassword.length < 12 || Buffer.byteLength(newPassword, 'utf8') > 72)) {
      return response.status(400).json({ message: 'New password must be at least 12 characters and at most 72 bytes.' })
    }
    const admin = await Admin.findById(request.admin.id).select('+passwordHash')
    if (!admin || !(await passwordMatches(currentPassword, admin.passwordHash))) {
      return response.status(403).json({ message: 'Current password is incorrect.' })
    }
    const updates = { email: normalizedEmail, credentialsManaged: true }
    if (newPassword) updates.passwordHash = await bcrypt.hash(newPassword, 12)
    const result = await Admin.updateOne({ _id: admin.id, $or: [{ sessionVersion: admin.sessionVersion || 0 }, { sessionVersion: { $exists: false } }] }, { $set: updates, $inc: { sessionVersion: 1 } })
    if (!result.modifiedCount) return response.status(409).json({ message: 'Account changed. Sign in again.' })
    return response.json({ message: 'Account updated. Sign in again with your updated credentials.' })
  } catch (error) { return next(error) }
}
