import { useEffect, useState } from 'react'
import { apiRequest, uploadFile } from '../../api/api.js'

const sectionNames = ['about', 'skills', 'projects', 'experience', 'education', 'certificates', 'profiles', 'services', 'contact']
const footerLinks = [
  ['email', 'Email'], ['whatsapp', 'WhatsApp'], ['github', 'GitHub'], ['linkedin', 'LinkedIn'],
  ['indeed', 'Indeed'], ['upwork', 'Upwork'], ['turing', 'Turing'], ['facebook', 'Facebook'],
  ['youtube', 'YouTube'], ['leetcode', 'LeetCode'], ['hackerrank', 'HackerRank'],
]
const footerSections = [
  ['identity', 'Identity / description'], ['quickLinks', 'Quick Links'], ['professional', 'Professional links'],
  ['socialRow', 'Social / contact row'], ['copyright', 'Copyright text'], ['privacy', 'Privacy link'],
  ['backToTop', 'Back to Top'],
]

export default function ManageSettings({ mode = 'website' }) {
  const [settings, setSettings] = useState(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let ignore = false
    apiRequest('/settings').then((data) => { if (!ignore) setSettings(data) }).catch((error) => setStatus(error.message))
    return () => { ignore = true }
  }, [])

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    try {
      setSettings(await apiRequest('/settings', { method: 'PUT', body: JSON.stringify(settings) }))
      setStatus('Website settings saved successfully')
    } catch (error) { setStatus(error.message) } finally { setBusy(false) }
  }

  async function upload(field, file) {
    if (!file) return
    setBusy(true)
    try {
      const result = await uploadFile(file)
      setSettings((current) => ({ ...current, [field]: result.url }))
      setStatus('File uploaded. Save settings to publish it.')
    } catch (error) { setStatus(error.message) } finally { setBusy(false) }
  }

  function updateFooter(field, value) {
    setSettings((current) => ({ ...current, footer: { ...current.footer, [field]: value } }))
  }

  function updateFooterLink(key, field, value) {
    setSettings((current) => ({
      ...current,
      footer: {
        ...current.footer,
        links: {
          ...current.footer?.links,
          [key]: { ...current.footer?.links?.[key], [field]: value },
        },
      },
    }))
  }

  function updateFooterSection(key, value) {
    setSettings((current) => ({
      ...current,
      footer: {
        ...current.footer,
        sections: { ...current.footer?.sections, [key]: value },
      },
    }))
  }

  async function uploadFooterLogo(file) {
    if (!file) return
    setBusy(true)
    try {
      setStatus('Uploading footer logo...')
      const result = await uploadFile(file)
      updateFooter('logoUrl', result.url)
      setStatus('Footer logo uploaded. Save changes to publish it.')
    } catch (error) { setStatus(error.message) } finally { setBusy(false) }
  }

  if (!settings) return <p className="admin-notice">{status || 'Loading settings…'}</p>

  const footer = settings.footer || { links: {}, sections: {} }

  return (
    <form className="content-form" onSubmit={save}>
      <h2>{mode === 'seo' ? 'SEO settings' : mode === 'resume' ? 'Resume manager' : 'Website settings'}</h2>
      {status ? <p className="admin-notice" role="status">{status}</p> : null}
      <fieldset disabled={busy} className="editor-fields"><div className="form-grid">
        {mode === 'seo' ? <>
          <label className="wide">Page title<input value={settings.pageTitle} onChange={(event) => setSettings({ ...settings, pageTitle: event.target.value })} maxLength="70" /></label>
          <label className="wide">Meta description<textarea value={settings.metaDescription} onChange={(event) => setSettings({ ...settings, metaDescription: event.target.value })} maxLength="170" /></label>
          <label className="wide">Keywords<input value={settings.keywords} onChange={(event) => setSettings({ ...settings, keywords: event.target.value })} /></label>
          <label>Open Graph image URL<input value={settings.ogImage} onChange={(event) => setSettings({ ...settings, ogImage: event.target.value })} /></label>
          <label>Upload Open Graph image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload('ogImage', event.target.files[0])} /></label>
        </> : null}
        {mode === 'resume' ? <>
          {settings.resumeUrl ? <div className="wide"><a href={settings.resumeUrl} target="_blank" rel="noopener noreferrer">View current resume</a><p>Upload a replacement, then save to publish it.</p><button type="button" onClick={() => setSettings({ ...settings, resumeUrl: '' })}>Remove resume link</button></div> : null}
          <label>Resume URL<input value={settings.resumeUrl} onChange={(event) => setSettings({ ...settings, resumeUrl: event.target.value })} /></label>
          <label>Replace resume PDF<input type="file" accept="application/pdf" onChange={(event) => upload('resumeUrl', event.target.files[0])} /></label>
        </> : null}
        {mode === 'website' ? <>
          <label>Website title<input value={settings.pageTitle} onChange={(event) => setSettings({ ...settings, pageTitle: event.target.value })} maxLength="70" /></label>
          <p className="wide">Edit your hero headline, name and professional title in <a href="/admin/profile">Profile / Hero</a>.</p>
          <label>Logo / Name<input value={settings.logoName} onChange={(event) => setSettings({ ...settings, logoName: event.target.value })} /></label>
          <label>Hire Me button text<input value={settings.hireMeText} onChange={(event) => setSettings({ ...settings, hireMeText: event.target.value })} /></label>
          <label>Copyright text<input value={settings.copyrightText} onChange={(event) => setSettings({ ...settings, copyrightText: event.target.value })} /></label>
          <label className="wide">Navbar links<input value={settings.navLinks || ''} onChange={(event) => setSettings({ ...settings, navLinks: event.target.value })} placeholder="Home|#top,About|#about,Projects|#work" /></label>
          <label>Default theme<select value={settings.defaultTheme} onChange={(event) => setSettings({ ...settings, defaultTheme: event.target.value })}><option value="dark">Dark</option><option value="light">Light</option></select></label>
          <fieldset className="wide section-toggles"><legend>Show / Hide sections</legend>{sectionNames.map((name) => <label key={name}><input type="checkbox" checked={settings.sections?.[name] !== false} onChange={(event) => setSettings({ ...settings, sections: { ...settings.sections, [name]: event.target.checked } })} /> {name}</label>)}</fieldset>
          <section className="footer-settings wide" aria-labelledby="footer-settings-title">
            <h3 id="footer-settings-title">Footer Settings</h3>
            <div className="footer-settings-grid">
              <label>Developer Name<input value={footer.developerName || ''} onChange={(event) => updateFooter('developerName', event.target.value)} /></label>
              <label className="wide">Short Description<textarea rows="3" value={footer.shortDescription || ''} onChange={(event) => updateFooter('shortDescription', event.target.value)} /></label>
              <label>Footer Logo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadFooterLogo(event.target.files[0])} /></label>
              <label>Footer Logo Alt Text<input value={footer.logoAlt || ''} onChange={(event) => updateFooter('logoAlt', event.target.value)} /></label>
              {footer.logoUrl ? <div className="footer-logo-preview wide"><span>Current footer logo</span><img src={footer.logoUrl} alt={footer.logoAlt || 'Footer logo preview'} /></div> : null}
              {footerLinks.map(([key, label]) => <label key={key}>{label}<input value={footer.links?.[key]?.url || ''} onChange={(event) => updateFooterLink(key, 'url', event.target.value)} placeholder={key === 'email' ? 'name@example.com' : key === 'whatsapp' ? '919876543210' : 'https://...'} /></label>)}
              <label className="wide">Copyright Text<input value={footer.copyrightText || ''} onChange={(event) => updateFooter('copyrightText', event.target.value)} /></label>
              <fieldset className="wide section-toggles"><legend>Show / Hide Social Links</legend>{footerLinks.map(([key, label]) => <label key={key}><input type="checkbox" checked={footer.links?.[key]?.visible !== false} onChange={(event) => updateFooterLink(key, 'visible', event.target.checked)} /> {label}</label>)}</fieldset>
              <fieldset className="wide section-toggles"><legend>Show / Hide Footer Sections</legend>{footerSections.map(([key, label]) => <label key={key}><input type="checkbox" checked={footer.sections?.[key] !== false} onChange={(event) => updateFooterSection(key, event.target.checked)} /> {label}</label>)}</fieldset>
              <label>Quick Links Heading<input value={footer.quickLinksHeading || ''} onChange={(event) => updateFooter('quickLinksHeading', event.target.value)} /></label>
              <label>Professional Heading<input value={footer.professionalHeading || ''} onChange={(event) => updateFooter('professionalHeading', event.target.value)} /></label>
              <label>Privacy Label<input value={footer.privacyLabel || ''} onChange={(event) => updateFooter('privacyLabel', event.target.value)} /></label>
              <label>Privacy URL<input value={footer.privacyUrl || ''} onChange={(event) => updateFooter('privacyUrl', event.target.value)} /></label>
              <label className="check-label wide"><input type="checkbox" checked={footer.useCurrentYear !== false} onChange={(event) => updateFooter('useCurrentYear', event.target.checked)} /> Add current year to copyright</label>
              <div className="footer-link-labels wide">
                <h4>Footer Link Labels</h4>
                <div className="footer-settings-grid">{footerLinks.map(([key, label]) => <label key={key}>{label} Label<input value={footer.links?.[key]?.label || label} onChange={(event) => updateFooterLink(key, 'label', event.target.value)} /></label>)}</div>
              </div>
            </div>
          </section>
        </> : null}
      </div>
      <div className="form-actions"><button disabled={busy}>{busy ? 'Please wait?' : 'Save changes'}</button></div></fieldset>
    </form>
  )
}
