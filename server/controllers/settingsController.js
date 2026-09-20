import { ensureSiteSettings } from '../services/siteSettingsService.js'
import { InputValidationError, sanitizeSettingsInput } from '../utils/validation.js'

export async function getSettings(_request, response, next) {
  try {
    response.json(await ensureSiteSettings())
  } catch (error) {
    next(error)
  }
}

export async function updateSettings(request, response, next) {
  try {
    const current = await ensureSiteSettings()
    current.set(sanitizeSettingsInput(request.body, current.toObject()))
    response.json(await current.save())
  } catch (error) {
    if (error instanceof InputValidationError) return response.status(400).json({ message: error.message })
    return next(error)
  }
}
