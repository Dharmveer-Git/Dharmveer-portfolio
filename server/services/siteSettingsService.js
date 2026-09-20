import SiteSettings, { DEFAULT_FOOTER, DEFAULT_SECTIONS, DEFAULT_SETTINGS } from '../models/SiteSettings.js'

const mergeDefaults = (defaults, saved) => Object.fromEntries(Object.entries(defaults).map(([key, value]) => {
  const savedValue = saved?.[key]
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return [key, mergeDefaults(value, savedValue)]
  }
  return [key, savedValue === undefined || savedValue === null ? value : savedValue]
}))

export async function ensureSiteSettings() {
  const settings = await SiteSettings.findOneAndUpdate(
    { singletonKey: 'site-settings' },
    { $setOnInsert: DEFAULT_SETTINGS },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )

  const sections = mergeDefaults(DEFAULT_SECTIONS, settings.sections)
  const footer = mergeDefaults(DEFAULT_FOOTER, settings.footer)
  let changed = false

  if (JSON.stringify(settings.sections) !== JSON.stringify(sections)) {
    settings.set('sections', sections)
    changed = true
  }
  if (JSON.stringify(settings.footer) !== JSON.stringify(footer)) {
    settings.set('footer', footer)
    changed = true
  }
  return changed ? settings.save() : settings
}

export default ensureSiteSettings
