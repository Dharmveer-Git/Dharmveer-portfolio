import { Router } from 'express'
import { login, me, overview, updateAccount } from '../controllers/adminController.js'
import { accountLimiter } from '../middleware/rateLimits.js'
import requireAdmin from '../middleware/requireAdmin.js'

const router = Router()

router.post('/login', login)
router.put('/account', requireAdmin, accountLimiter, updateAccount)
router.get('/me', requireAdmin, me)
router.get('/overview', requireAdmin, overview)

export default router
