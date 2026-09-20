import ContentItem, { CONTENT_RESOURCES } from '../models/ContentItem.js'
import { ensureSiteSettings } from '../services/siteSettingsService.js'

export async function getPortfolio(_request, response, next) {
  try {
    const [items, settings] = await Promise.all([
      ContentItem.find({ active: true }).sort({ resource: 1, order: 1, createdAt: 1 }).lean(),
      ensureSiteSettings(),
    ])
    const content = Object.fromEntries(CONTENT_RESOURCES.map((resource) => [
      resource,
      items.filter((item) => item.resource === resource),
    ]))
    response.json({ content, settings })
  } catch (error) {
    next(error)
  }
}
