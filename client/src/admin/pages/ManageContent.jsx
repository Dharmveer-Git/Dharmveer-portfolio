import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest, contentApi, uploadFile } from '../../api/api.js'

const pageFields = {
  profile: ['title', 'subtitle', 'description', 'headline', 'image'],
  about: ['title', 'description', 'image'],
  skills: ['title', 'subtitle'],
  projects: ['title', 'subtitle', 'description', 'image', 'githubUrl', 'liveUrl', 'tags', 'features'],
  experience: ['title', 'subtitle', 'description', 'startDate', 'endDate', 'tags', 'features'],
  education: ['title', 'subtitle', 'description', 'startDate', 'endDate'],
  certificates: ['title', 'subtitle', 'image', 'url', 'endDate'],
  services: ['title', 'description'],
}
const fieldLabels = { title: 'Title / Name', subtitle: 'Role / Organization', description: 'Description', headline: 'Hero headline', image: 'Image / document URL', url: 'Website URL', githubUrl: 'GitHub URL', liveUrl: 'Live demo URL', startDate: 'Start date', endDate: 'End date', tags: 'Technologies (comma separated)', features: 'Features (comma separated)' }

const aliases = { social: 'socials' }
const empty = { title: '', subtitle: '', description: '', headline: '', image: '', url: '', githubUrl: '', liveUrl: '', startDate: '', endDate: '', tags: '', features: '', order: 0, active: true, featured: false }
const reorderablePages = new Set(['skills', 'projects', 'certificates'])

export default function ManageContent() {
  const navigate = useNavigate()
  const page = useLocation().pathname.split('/').pop()
  const resource = aliases[page] || page
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState('')
  const [status, setStatus] = useState('')
  const [draggedId, setDraggedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const fields = pageFields[page] || []
  const visibleItems = items.filter((item) => `${item.title || ''} ${item.subtitle || ''}`.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (page === 'settings') {
      return undefined
    }

    let ignore = false
    const endpoint = page === 'dashboard' ? '/admin/overview' : page === 'messages' ? '/messages' : `/admin/content/${resource}`
    apiRequest(endpoint).then((data) => { if (!ignore) setItems(page === 'dashboard' ? [data] : data) }).catch((error) => { if (!ignore) setStatus(error.message) }).finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [page, resource])

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const data = { ...form, meta: { ...form.meta, headline: form.headline }, tags: form.tags.split(',').map((v) => v.trim()).filter(Boolean), features: form.features.split(',').map((v) => v.trim()).filter(Boolean), order: Number(form.order), active: Boolean(form.active), featured: Boolean(form.featured) }
      const saved = editing ? await contentApi.update(resource, editing, data) : await contentApi.create(resource, data)
      setItems((all) => editing ? all.map((item) => item._id === editing ? saved : item) : [...all, saved])
      setForm(empty); setEditing(''); setStatus('Saved successfully')
    } catch (error) { setStatus(error.message) } finally { setBusy(false) }
  }

  async function remove(id) {
    if (!window.confirm('Delete this item permanently?')) return
    setBusy(true)
    try {
      if (page === 'messages') await apiRequest(`/messages/${id}`, { method: 'DELETE' })
      else await contentApi.remove(resource, id)
      setItems((all) => all.filter((item) => item._id !== id)); setStatus('Deleted')
      if (editing === id) { setEditing(''); setForm(empty) }
    } catch (error) { setStatus(error.message) } finally { setBusy(false) }
  }

  function edit(item) {
    document.getElementById('content-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    document.getElementById('editor-title')?.focus({ preventScroll: true })
    setEditing(item._id)
    setForm({ ...empty, ...item, headline: item.meta?.headline || '', tags: item.tags?.join(', ') || '', features: item.features?.join(', ') || '' })
  }

  async function reorder(targetId) {
    if (!draggedId || draggedId === targetId) return
    const next = [...items]
    const from = next.findIndex((item) => item._id === draggedId)
    const to = next.findIndex((item) => item._id === targetId)
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setDraggedId('')
    await persistOrder(next)
  }

  async function persistOrder(next) {
    setBusy(true)
    try {
      await apiRequest(`/${resource}/reorder`, { method: 'PATCH', body: JSON.stringify({ ids: next.map((item) => item._id) }) })
      setItems(next)
      setStatus('Order updated')
    } catch (error) { setStatus(error.message) } finally { setBusy(false) }
  }

  async function move(id, direction) {
    const next = [...items]
    const index = next.findIndex((item) => item._id === id)
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    await persistOrder(next)
  }

  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setStatus('Choose a file smaller than 5 MB.'); return }
    setBusy(true)
    setStatus('Uploading file...')
    try {
      const data = await uploadFile(file)
      setForm((current) => ({ ...current, image: data.url }))
      setStatus('File uploaded. Save the item to publish it.')
    } catch (error) { setStatus(error.message) } finally { setBusy(false) }
  }

  async function toggleRead(item) {
    setBusy(true)
    try {
      const updated = await apiRequest(`/messages/${item._id}/read`, { method: 'PATCH', body: JSON.stringify({ read: !item.read }) })
      setItems((all) => all.map((entry) => entry._id === item._id ? updated : entry))
      setStatus('Message updated')
    } catch (error) { setStatus(error.message) } finally { setBusy(false) }
  }

  if (loading) return <p className="admin-notice" role="status">Loading content...</p>

  if (page === 'settings') return <section className="settings-card"><h2>Admin settings</h2><p>Your session is protected with JWT authentication.</p><button onClick={() => { localStorage.removeItem('portfolio_token'); navigate('/admin/login') }}>Log out securely</button></section>
  if (page === 'dashboard') {
    const stats = items[0] || {}
    return <section className="overview-grid"><article><span>Content items</span><strong>{stats.content ?? '—'}</strong></article><article><span>Messages</span><strong>{stats.messages ?? '—'}</strong></article><article><span>Unread</span><strong>{stats.unread ?? '—'}</strong></article><article><span>Database</span><strong className={stats.database === 'connected' ? 'database-online' : 'database-offline'}>{stats.database === 'connected' ? 'Connected' : 'Disconnected'}</strong></article></section>
  }
  if (page === 'messages') return <>
    {status ? <p role="status" className="admin-notice">{status}</p> : null}
    <section className="admin-list">
      {!items.length ? <p>No contact messages yet.</p> : null}
      {items.map((item) => <article className={item.read ? '' : 'unread'} key={item._id}>
        <div><strong>{item.subject}</strong><span>{item.name} / {item.email}</span><p>{item.message}</p></div>
        <div><button disabled={busy} onClick={() => toggleRead(item)}>{item.read ? 'Mark unread' : 'Mark read'}</button><button disabled={busy} onClick={() => remove(item._id)}>Delete</button></div>
      </article>)}
    </section>
  </>

  return (
    <>
      {status ? <p className="admin-notice" role="status">{status}</p> : null}
      <form className="content-form" id="content-editor" onSubmit={save}>
        <div className="editor-heading"><div><p className="admin-eyebrow">{editing ? 'EDIT CONTENT' : 'CREATE CONTENT'}</p><h2 id="editor-title" tabIndex="-1">{editing ? `Edit ${page === 'profile' ? 'hero' : page}` : `Add ${page === 'profile' ? 'hero' : page}`}</h2></div><a href="/" target="_blank" rel="noopener noreferrer">Preview website</a></div>
        {page === 'profile' ? <p className="form-help">Add one primary profile. Upload a square or portrait JPG, PNG, or WebP image; it will appear once, in the homepage hero.</p> : null}
        {page === 'projects' ? <p className="form-help">Add a clear screenshot, a concise overview, technologies, and your demo/source links. The full description and features appear on the project detail page.</p> : null}
        <fieldset disabled={busy} className="editor-fields">
        <div className="form-grid">
          {fields.map((field) => <label key={field} className={field === 'description' ? 'wide' : ''}>
            {page === 'projects' && field === 'title' ? 'Project title' : page === 'projects' && field === 'subtitle' ? 'Project category / short label' : page === 'projects' && field === 'image' ? 'Project screenshot URL' : field === 'subtitle' && page === 'skills' ? 'Skill category' : field === 'subtitle' && page === 'experience' ? 'Company name' : field === 'title' && page === 'experience' ? 'Role' : field === 'subtitle' && page === 'education' ? 'College / Institution' : fieldLabels[field]}
            {field === 'subtitle' && page === 'skills' ? <select value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })}><option value="">Choose category</option>{['Frontend', 'Backend', 'Database', 'Tools'].map((category) => <option key={category}>{category}</option>)}</select> : field === 'description' ? <textarea rows="4" value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /> : <input required={field === 'title'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />}
          </label>)}
          {page === 'projects' ? ['problem', 'solution', 'learning'].map((key) => <label className="wide" key={key}>{key === 'problem' ? 'Problem solved' : key === 'solution' ? 'Your solution' : 'What you learned'}<textarea rows="3" value={form.meta?.[key] || ''} onChange={(event) => setForm({ ...form, meta: { ...form.meta, [key]: event.target.value } })} /></label>) : null}
          {fields.includes('image') ? <>
            <label>Upload {page === 'certificates' ? 'image or PDF' : 'image'}<input type="file" accept={page === 'certificates' ? 'image/jpeg,image/png,image/webp,application/pdf' : 'image/jpeg,image/png,image/webp'} onChange={upload} /></label>
            {form.image ? <div className="wide admin-media-preview"><a href={form.image} target="_blank" rel="noopener noreferrer">View current file</a>{!form.image.toLowerCase().endsWith('.pdf') ? <img src={form.image} alt="Selected upload preview" /> : null}<button type="button" onClick={() => setForm({ ...form, image: '' })}>Remove from this item</button></div> : null}
          </> : null}
          <label className="check-label"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Show this item</label>
          {page === 'projects' ? <label className="check-label"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured project</label> : null}
        </div>
        <div className="form-actions"><button disabled={busy}>{busy ? 'Please wait...' : editing ? 'Update item' : 'Add item'}</button>{editing ? <button type="button" onClick={() => { setEditing(''); setForm(empty) }}>Cancel</button> : null}</div>
        </fieldset>
      </form>
      <div className="saved-content-heading"><h2>Saved items ({items.length})</h2><label>Search content<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or organization" /></label></div>
      {items.length > 0 && !visibleItems.length ? <p className="admin-notice">No matching items. Try a different search.</p> : null}
      {!items.length ? <p className="admin-notice">No items yet. Use the form above to add your first item.</p> : null}
      <section className={`admin-list ${reorderablePages.has(page) ? 'reorderable' : ''}`}>{visibleItems.map((item) => <article key={item._id} draggable={!busy && !query && reorderablePages.has(page)} onDragStart={() => setDraggedId(item._id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (!query) void reorder(item._id) }}><div className="saved-item-content">{page === 'projects' && item.image ? <img className="saved-project-image" src={item.image} alt="" loading="lazy" /> : null}<strong>{reorderablePages.has(page) ? '⋮⋮ ' : ''}{item.title}</strong><span>{item.subtitle || item.description}</span></div><div><span className={item.active ? 'item-status published' : 'item-status draft'}>{item.active ? 'Published' : 'Draft'}</span>{item.featured ? <span className="featured-badge">Featured</span> : null}{reorderablePages.has(page) ? <><button disabled={busy || Boolean(query) || items.indexOf(item) === 0} onClick={() => move(item._id, -1)} aria-label={`Move ${item.title} up`}>↑</button><button disabled={busy || Boolean(query) || items.indexOf(item) === items.length - 1} onClick={() => move(item._id, 1)} aria-label={`Move ${item.title} down`}>↓</button></> : null}<button disabled={busy} onClick={() => edit(item)}>Edit</button><button disabled={busy} onClick={() => remove(item._id)}>Delete</button></div></article>)}</section>
    </>
  )
}
