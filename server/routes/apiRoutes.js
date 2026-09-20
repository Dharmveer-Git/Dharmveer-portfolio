import { Router } from 'express'
import {
  createContent,
  deleteContent,
  getPublicContent,
  patchContent,
  listAdminContent,
  listPublicContent,
  reorderContent,
  updateContent,
} from '../controllers/contentController.js'
import {
  createMessage,
  deleteMessage,
  getMessage,
  listMessages,
  setMessageRead,
} from '../controllers/messageController.js'
import { getPortfolio } from '../controllers/portfolioController.js'
import { getSettings, updateSettings } from '../controllers/settingsController.js'
import { uploadFile } from '../controllers/uploadController.js'
import requireAdmin from '../middleware/requireAdmin.js'
import { messageLimiter } from '../middleware/rateLimits.js'
import upload from '../middleware/upload.js'

const router = Router()

router.get('/portfolio', getPortfolio)
router.get('/settings', getSettings)
router.put('/settings', requireAdmin, updateSettings)

router.post('/messages', messageLimiter, createMessage)
router.get('/messages', requireAdmin, listMessages)
router.get('/messages/:id', requireAdmin, getMessage)
router.patch('/messages/:id/read', requireAdmin, setMessageRead)
router.delete('/messages/:id', requireAdmin, deleteMessage)

router.post('/upload', requireAdmin, upload.single('file'), uploadFile)
router.get('/admin/content/:resource', requireAdmin, listAdminContent)

router.get('/:resource', listPublicContent)
router.get('/:resource/:id', getPublicContent)
router.post('/:resource', requireAdmin, createContent)
router.patch('/:resource/reorder', requireAdmin, reorderContent)
router.patch('/:resource/:id', requireAdmin, patchContent)
router.put('/:resource/:id', requireAdmin, updateContent)
router.delete('/:resource/:id', requireAdmin, deleteContent)

export default router
