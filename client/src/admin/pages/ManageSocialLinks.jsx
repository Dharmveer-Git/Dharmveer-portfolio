import { isValidSocialLink } from '../../utils/socialLinks.js'
import { useEffect, useState } from 'react'
import { apiRequest, contentApi, uploadFile } from '../../api/api.js'
import { isImageSource } from '../../utils/imageSource.js'

const platforms = ['LinkedIn', 'GitHub', 'Indeed', 'Naukri', 'Turing', 'Upwork', 'Email', 'WhatsApp', 'YouTube', 'LeetCode', 'HackerRank', 'Fiverr', 'Facebook']

const normalizeUrl = (platform, value) => {
  const input = value.trim()
  if (!input) return ''
  if (platform === 'Email') return input.startsWith('mailto:') ? input : `mailto:${input}`
  if (platform === 'WhatsApp') return input.startsWith('http') ? input : `https://wa.me/${input.replace(/\D/g, '')}`
  return /^https?:\/\//i.test(input) || /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`
}

export default function ManageSocialLinks() {
  const [links, setLinks] = useState({})
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let ignore = false
    apiRequest('/admin/content/socials').then((items) => {
      if (ignore) return
      setLinks(Object.fromEntries(platforms.map((platform) => {
        const item = items.find((entry) => entry.title.toLowerCase() === platform.toLowerCase())
        return [platform, { id: item?._id || '', url: item?.url || '', icon: item?.image || '', enabled: item?.active ?? true }]
      })))
    }).catch((error) => setStatus(error.message)).finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [])

  async function save(event) {
    event.preventDefault()
    const invalid = platforms.find((platform) => {
      const value = links[platform]?.url?.trim()
      return value && !isValidSocialLink({ title: platform, url: normalizeUrl(platform, value) })
    })
    if (invalid) { setStatus(`Enter a valid ${invalid} link before saving.`); return }
    setBusy(true)
    setStatus('Saving social links…')
    try {
      const saved = await Promise.all(platforms.map(async (platform, order) => {
        const current = links[platform] || { url: '', enabled: true }
        const data = { title: platform, url: normalizeUrl(platform, current.url), image: current.icon?.trim() || '', active: Boolean(current.enabled && current.url.trim()), order }
        return current.id ? contentApi.update('socials', current.id, data) : data.url ? contentApi.create('socials', data) : null
      }))
      setLinks((current) => Object.fromEntries(platforms.map((platform, index) => [platform, { ...current[platform], id: saved[index]?._id || current[platform]?.id || '', url: saved[index]?.url || current[platform]?.url || '', icon: saved[index]?.image || current[platform]?.icon || '', enabled: saved[index]?.active ?? current[platform]?.enabled ?? true }])))
      setStatus('Social links published successfully')
    } catch (error) { setStatus(error.message) } finally { setBusy(false) }
  }

  return (
    <form className="content-form social-manager" onSubmit={save}>
      <h2>Social Links</h2>
      <p className="form-help">Blank links stay hidden. WhatsApp accepts a country-code number; Email accepts a normal email address.</p>
      {status ? <p className="admin-notice" role="status">{status}</p> : null}
      <fieldset className="editor-fields" disabled={busy || loading}><div className="social-fields">{platforms.map((platform) => {
        const current = links[platform] || { url: '', enabled: true }
        return <div className="social-field" key={platform}>
          <div className="social-field-head">{isImageSource(current.icon) ? <img src={current.icon} alt="" /> : <span>{platform.slice(0, 2).toUpperCase()}</span>}<strong>{platform}</strong></div>
          <label>Profile URL<input value={current.url} onChange={(event) => setLinks({ ...links, [platform]: { ...current, url: event.target.value } })} placeholder={platform === 'WhatsApp' ? '919876543210' : platform === 'Email' ? 'name@example.com' : `https://${platform.toLowerCase()}.com/...`} /></label>
          <label>Icon URL<input value={current.icon || ''} onChange={(event) => setLinks({ ...links, [platform]: { ...current, icon: event.target.value } })} placeholder="https://.../icon.svg" /></label>
          <label>Upload icon<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (event) => { const file = event.target.files[0]; if (!file) return; try { const uploaded = await uploadFile(file); setLinks((all) => ({ ...all, [platform]: { ...all[platform], icon: uploaded.url } })); setStatus(`${platform} icon uploaded. Save to publish.`) } catch (error) { setStatus(error.message) } }} /></label>
          <label className="social-toggle"><input type="checkbox" checked={current.enabled} onChange={(event) => setLinks({ ...links, [platform]: { ...current, enabled: event.target.checked } })} /> Show publicly</label>
        </div>
      })}</div>
      <div className="form-actions"><button>{busy ? 'Saving...' : loading ? 'Loading...' : 'Save social links'}</button></div></fieldset>
    </form>
  )
}
