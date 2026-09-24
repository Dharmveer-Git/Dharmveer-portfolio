import ProfileDialog from '../components/ProfileDialog.jsx'
import { isValidSocialLink } from '../utils/socialLinks.js'
import { useEffect, useState } from 'react'
import Footer from '../components/Footer.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import SocialLinks from '../components/SocialLinks.jsx'
import SocialIcon from '../components/SocialIcon.jsx'
import { apiRequest, sendMessage } from '../api/api.js'
import Arrow from '../components/Arrow.jsx'

const fallback = {
  profile: [],
  about: [],
  socials: [],
  skills: [],
  projects: [],
  experience: [],
  education: [],
  certificates: [],
  services: [],
}

const fallbackSettings = {
  logoName: 'DK.', hireMeText: 'Hire me', copyrightText: 'Dharmveer Kumar', navLinks: 'Home|#top,About|#about,Skills|#skills,Projects|#work,Experience|#experience,Education|#education,Contact|#contact', defaultTheme: 'dark', resumeUrl: '/resume.pdf',
  pageTitle: 'Dharmveer Kumar | Full Stack Developer', metaDescription: 'Full Stack Developer specializing in React, Node.js, MongoDB, Java and Spring Boot.', keywords: '', ogImage: '', sections: {},
}

const navigationOrder = ['#top', '#about', '#work', '#skills', '#experience', '#education', '#certificates', '#contact']
const navigationSections = {
  '#about': 'about',
  '#skills': 'skills',
  '#work': 'projects',
  '#experience': 'experience',
  '#education': 'education',
  '#certificates': 'certificates',
  '#contact': 'contact',
}

const selectSocials = (items, names) => names.map((name) => items.find((item) => item.title.toLowerCase() === name.toLowerCase())).filter(Boolean)
const skillCategories = [
  ['Frontend', ['html', 'css', 'javascript', 'react', 'bootstrap', 'tailwind']],
  ['Backend', ['node', 'express', 'rest', 'api', 'jwt', 'mvc', 'backend']],
  ['Database', ['mongodb', 'mysql', 'postgres', 'redis', 'database']],
  ['Tools', ['git', 'postman', 'vs code', 'compass', 'docker']],
]
const groupSkills = (skills) => {
  const groups = new Map(skillCategories.map(([category]) => [category, []]))
  for (const skill of skills) {
    const normalized = `${skill.title || ''}`.toLowerCase()
    const savedCategory = skillCategories.find(([name]) => name.toLowerCase() === skill.subtitle?.toLowerCase())?.[0]
    const category = savedCategory || (normalized.includes('compass') ? 'Tools' : skillCategories.find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))?.[0] || 'Tools')
    groups.get(category).push(skill)
  }
  return [...groups].filter(([, items]) => items.length)
}

export default function Portfolio() {
  const [content, setContent] = useState(fallback)
  const [settings, setSettings] = useState(fallbackSettings)
  const [apiOnline, setApiOnline] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' })
  const [formStatus, setFormStatus] = useState({ loading: false, message: '', error: false })
  const [theme, setTheme] = useState(() => localStorage.getItem('portfolio_theme') || 'dark')
  const [profileOpen, setProfileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('top')
  const profile = content.profile?.[0]
  const about = content.about?.[0]
  const portrait = profile?.image || '/profile-optimized.jpg'
  const visibleSocials = content.socials.filter(isValidSocialLink)
  const heroSocials = selectSocials(visibleSocials, ['GitHub', 'LinkedIn', 'Indeed', 'Naukri', 'Turing'])
  const whatsapp = visibleSocials.find((item) => item.title.toLowerCase() === 'whatsapp')
  const footerContact = selectSocials(visibleSocials, ['Email', 'WhatsApp', 'YouTube', 'Facebook'])
  const footerEmail = footerContact.find((item) => item.title.toLowerCase() === 'email')
  const contactProfileLinks = selectSocials(visibleSocials, ['GitHub', 'LinkedIn', 'WhatsApp', 'Email'])
  const groupedSkills = groupSkills(content.skills)
  const sectionAvailability = {
    about: settings.sections.about !== false,
    skills: settings.sections.skills !== false,
    projects: settings.sections.projects !== false,
    experience: settings.sections.experience !== false,
    education: settings.sections.education !== false,
    certificates: settings.sections.certificates !== false,
    services: settings.sections.services !== false && content.services.length > 0,
    contact: settings.sections.contact !== false,
  }
  const navItems = settings.navLinks
    .split(',')
    .map((item) => item.trim().split('|'))
    .filter((item) => item.length === 2)
    .filter(([, href]) => navigationOrder.includes(href))
    .filter(([, href]) => !navigationSections[href] || sectionAvailability[navigationSections[href]])
    .sort((a, b) => navigationOrder.indexOf(a[1]) - navigationOrder.indexOf(b[1]))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('portfolio_theme', theme)
  }, [theme])

  useEffect(() => {
    document.title = settings.pageTitle
    const values = [
      ['meta[name="description"]', settings.metaDescription], ['meta[name="keywords"]', settings.keywords],
      ['meta[property="og:title"]', settings.pageTitle], ['meta[property="og:description"]', settings.metaDescription], ['meta[property="og:image"]', settings.ogImage],
    ]
    values.forEach(([selector, value]) => { const element = document.querySelector(selector); if (element && value) element.setAttribute('content', value) })
  }, [settings])

  useEffect(() => {
    let stopped = false
    let loading = false

    const loadPortfolio = async () => {
      if (loading) return
      loading = true
      try {
        const { content: savedContent, settings: siteSettings } = await apiRequest('/portfolio')
        if (stopped) return
        setContent(Object.fromEntries(Object.keys(fallback).map((resource) => [
          resource,
          Array.isArray(savedContent?.[resource]) ? savedContent[resource] : [],
        ])))
        if (siteSettings) {
          setSettings({ ...fallbackSettings, ...siteSettings, sections: { ...siteSettings.sections } })
          if (!localStorage.getItem('portfolio_theme')) setTheme(siteSettings.defaultTheme)
        }
        setApiOnline(true)
      } catch {
        if (!stopped) setApiOnline(false)
      } finally {
        loading = false
      }
    }

    void loadPortfolio()
    const interval = window.setInterval(loadPortfolio, 10_000)
    return () => {
      stopped = true
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const sectionIds = navigationOrder.map((href) => href.slice(1))
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveSection(visible.target.id)
    }, { rootMargin: '-20% 0px -65%', threshold: [0, .2, .5] })
    sectionIds.map((id) => document.getElementById(id)).filter(Boolean).forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [content, settings.sections])

  async function submitMessage(event) {
    event.preventDefault()
    setFormStatus({ loading: true, message: '', error: false })
    try {
      const result = await sendMessage(form)
      setForm({ name: '', email: '', company: '', subject: '', message: '' })
      setFormStatus({ loading: false, message: result.message, error: false })
    } catch (error) {
      setFormStatus({ loading: false, message: error.message, error: true })
    }
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#top">Skip to content</a>
      <header className="header" onKeyDown={(event) => {
        if (event.key === 'Escape' && menuOpen) {
          setMenuOpen(false)
          event.currentTarget.querySelector('.menu-toggle')?.focus()
        }
      }}>
        <a className="logo" href="#top" aria-label="Home">{settings.logoName}</a>
        <nav id="primary-navigation" className={menuOpen ? 'open' : ''} aria-label="Primary navigation">
          {navItems.map(([label, href]) => <a className={activeSection === href.replace('#', '') ? 'active' : ''} aria-current={activeSection === href.slice(1) ? 'location' : undefined} key={`${label}-${href}`} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <button className="theme-toggle" onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? '☀' : '☾'}</button>
          {settings.resumeUrl ? <a className="header-resume" href="#resume">Resume</a> : null}
          {sectionAvailability.contact ? <a className="available" href="#contact"><i /> {settings.hireMeText}</a> : null}
          <button className="menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="primary-navigation" aria-label="Toggle navigation"><span /><span /></button>
        </div>
      </header>

      <main id="top" tabIndex="-1">
        <section className="hero" aria-labelledby="hero-title">
          <div className="profile-orbit has-photo">
            <span>{(profile?.title || 'DK').split(' ').map((word) => word[0]).slice(0, 2).join('')}</span>
            <img key={portrait} src={portrait} alt={`${profile?.title || 'Dharmveer Kumar'} profile`} width="640" height="640" fetchPriority="high" onError={(event) => { event.currentTarget.hidden = true }} />
          </div>
          <p className="kicker hero-kicker">Portfolio / Software development</p>
          <div className="hero-identity"><span>{profile?.subtitle || 'Full-Stack Developer'}</span></div>
          <h1 id="hero-title">{profile?.title || 'Dharmveer Kumar'}</h1>
          {profile?.meta?.headline ? <p className="hero-headline">{profile.meta.headline}</p> : null}
          <div className="hero-bottom">
            <p>{profile?.description || 'Explore my work, experience, and approach to building thoughtful digital products.'}</p>
            <div className="hero-actions">
              {sectionAvailability.projects ? <a className="primary-action" href="#work">View Projects <Arrow /></a> : null}
              {sectionAvailability.contact ? <a href="#contact">Contact Me <Arrow /></a> : null}
            </div>
            <div className="hero-secondary-actions">
              <button className="profile-action" onClick={() => setProfileOpen(true)}>Read full profile <Arrow /></button>
              {settings.resumeUrl ? <a href={settings.resumeUrl} download>Download resume <Arrow /></a> : null}
            </div>
          </div>
          <SocialLinks items={heroSocials} className="hero-socials" />
          <div className="stamp" aria-hidden="true"><span>DESIGN</span><b>×</b><span>CODE</span></div>
        </section>

        {sectionAvailability.skills && groupedSkills.length > 0 ? <aside className="proof-strip" aria-label="Technical focus">
          <p>Technical focus</p>
          {groupedSkills.slice(0, 3).map(([category, skills]) => <div key={category}><strong>{category}</strong><span>{skills.slice(0, 3).map((skill) => skill.title).join(' / ')}</span></div>)}
        </aside> : null}

        <section className="about section" id="about" hidden={!sectionAvailability.about}>
          <div className="section-head"><p className="kicker">01 / About me</p><h2>Engineer’s mind.<br />Designer’s eye.</h2></div>
          <div className="about-grid">
            <div className="about-copy">
              <p className="lead">{about?.title || 'Strong engineering should feel simple on the other side.'}</p>
              <p>{about?.description || 'I work across the stack—from accessible React interfaces to secure Express APIs and MongoDB data models. My focus is maintainable code, thoughtful UX, and products teams can confidently build on.'}</p>
              <div className="facts">
                {sectionAvailability.education && content.education[0]?.title ? <div><span>Education</span><strong>{content.education[0].title}</strong></div> : null}
                {profile?.subtitle ? <div><span>Specialization</span><strong>{profile.subtitle}</strong></div> : null}
                {profile?.location ? <div><span>Location</span><strong>{profile.location}</strong></div> : null}
              </div>
            </div>
          </div>
        </section>

        <section className="work section" id="work" hidden={!sectionAvailability.projects}>
          <div className="section-head"><p className="kicker">02 / Selected work</p><h2>Projects & case studies.</h2></div>
          {content.projects.length === 0 ? <p className="section-empty">{apiOnline ? 'Project case studies will appear here once published.' : 'Projects are temporarily unavailable. Please try again shortly.'}</p> : null}
          <div className="project-list">
            {content.projects.map((project, index) => <ProjectCard key={project._id} project={project} index={index} />)}
          </div>
        </section>

        <section className="skills-section section" id="skills" hidden={!sectionAvailability.skills}>
          <div className="section-head"><p className="kicker">03 / Skills</p><h2>Technical expertise.</h2></div>
          {groupedSkills.length === 0 ? <p className="section-empty">Skills will appear here once published.</p> : null}
          <div className="skill-categories">{groupedSkills.map(([category, skills]) => <article className="skill-category" key={category}><div><span>{String(skillCategories.findIndex(([name]) => name === category) + 1).padStart(2, '0')}</span><h3>{category}</h3></div><ul>{skills.map((skill) => <li key={skill._id}>{skill.title}</li>)}</ul></article>)}</div>
        </section>

        <section className="experience section" id="experience" hidden={!sectionAvailability.experience}>
          <div className="section-head"><p className="kicker">04 / Experience</p><h2>Professional experience.</h2></div>
          {content.experience.length === 0 ? <p className="section-empty">Experience details will appear here once published.</p> : null}
          <div className="timeline">{content.experience.map((item) => <article key={item._id}><span>{item.startDate}—{item.endDate}</span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div><p>{item.description}<br />{item.tags?.join(' · ')}</p></article>)}</div>
        </section>

        <section className="education section" id="education" hidden={!sectionAvailability.education}>
          <div className="section-head"><p className="kicker">05 / Education</p><h2>Education & foundations.</h2></div>
          {content.education.length === 0 ? <p className="section-empty">Education details will appear here once published.</p> : null}
          <div className="education-grid">{content.education.map((item) => <article key={item._id}><span>{[item.startDate, item.endDate].filter(Boolean).join(' – ')}</span><h3>{item.title}</h3><p>{item.subtitle}</p>{item.description ? <p>{item.description}</p> : null}</article>)}</div>
        </section>

        <section className="certificates section" id="certificates" hidden={!sectionAvailability.certificates} aria-labelledby="certificates-title">
          <div className="section-head"><p className="kicker">Certificates</p><h2 id="certificates-title">Certificates & credentials.</h2></div>
          {!content.certificates.length ? <p className="section-empty">Certificates will appear here once published.</p> : null}
          <div className="certificate-grid">{content.certificates.map((item) => <article key={item._id}>
            {item.image ? <div className="certificate-art">{/\.pdf(?:[?#]|$)/i.test(item.image) ? <span>PDF</span> : <img src={item.image} alt={item.title} loading="lazy" decoding="async" />}</div> : null}
            <p>{item.subtitle}</p><h3>{item.title}</h3>{item.description ? <p>{item.description}</p> : null}
            {item.url || item.image ? <a href={item.url || item.image} target="_blank" rel="noopener noreferrer">View certificate <Arrow /></a> : null}
          </article>)}</div>
        </section>

        <section className="services section" id="services" hidden={!sectionAvailability.services}>
          <div className="section-head"><p className="kicker">06 / Services</p><h2>Ways I can help.</h2></div>
          <ol>{content.services.map((item, index) => <li key={item._id}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><Arrow /></li>)}</ol>
        </section>

        {settings.resumeUrl ? <section className="resume-section section" id="resume" aria-labelledby="resume-title">
          <div className="section-head"><p className="kicker">07 / Resume</p><h2 id="resume-title">My experience, at a glance.</h2></div>
          <div className="resume-panel">
            <div><p className="kicker">Curriculum vitae</p><h3>{profile?.title}</h3><p>{profile?.subtitle}</p><p>{profile?.description}</p>
              <div className="hero-actions"><a className="primary-action" href={settings.resumeUrl} target="_blank" rel="noopener noreferrer">View Resume <Arrow /></a><a href={settings.resumeUrl} download>Download Resume</a></div>
            </div>
            <details className="resume-preview"><summary>Preview resume</summary><object data={settings.resumeUrl} type="application/pdf" aria-label="Resume document preview"><p>Preview unavailable. <a href={settings.resumeUrl} target="_blank" rel="noopener noreferrer">Open resume</a></p></object></details>
          </div>
        </section> : null}

        <section className="contact" id="contact" hidden={!sectionAvailability.contact}>
          <div className="section-head"><p className="kicker">08 / Contact</p><h2>Let's discuss your next project.</h2></div>
          <div className="contact-grid">
            <aside className="contact-profile" aria-label="Developer contact details">
              <div className="contact-profile-head">
                <div className="contact-avatar contact-monogram" aria-hidden="true"><span>{(profile?.title || 'DK').split(' ').map((word) => word[0]).slice(0, 2).join('')}</span></div>
                <div><p><i /> Available for work</p><h3>{profile?.title || 'Dharmveer Kumar'}</h3><span>{profile?.subtitle || 'Full-Stack Developer'}</span></div>
              </div>
              <div className="contact-profile-list">
                <div><span className="contact-row-icon" aria-hidden="true">⌖</span><strong>{profile?.location || 'India'}</strong></div>
                {footerEmail ? <a href={footerEmail.url}><SocialIcon item={footerEmail} size={28} /><strong>{footerEmail.url.replace('mailto:', '')}</strong></a> : null}
                {contactProfileLinks.filter((item) => item.title.toLowerCase() !== 'email').map((item) => <a key={item._id} href={item.url} target="_blank" rel="noopener noreferrer"><SocialIcon item={item} size={28} /><strong>{item.title}</strong></a>)}
              </div>
              <div className="contact-promise"><span>Start a conversation</span><strong>Projects, roles & collaboration</strong></div>
              {!apiOnline ? <p className="api-warning">The contact form is temporarily unavailable. Please use one of the contact links above.</p> : null}
            </aside>
            <form className="contact-form" onSubmit={submitMessage} aria-busy={formStatus.loading}>
              <p className="form-hint">All fields are required.</p>
              <div><label>Full name<input name="name" autoComplete="name" placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength="80" /></label><label>Email address<input name="email" autoComplete="email" placeholder="you@example.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label></div>
              <label>Subject<input name="subject" placeholder="What would you like to discuss?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required maxLength="160" /></label>
              <label>Message<textarea name="message" placeholder="Tell me about your project, goals, or opportunity." rows="5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength="3000" /></label>
              {formStatus.message ? <p className={formStatus.error ? 'form-error' : 'form-success'} role={formStatus.error ? 'alert' : 'status'}>{formStatus.message}</p> : null}
              <button disabled={formStatus.loading || !apiOnline}>{formStatus.loading ? 'Sending…' : 'Send message'} <Arrow /></button>
            </form>
          </div>
        </section>
      </main>
      {whatsapp ? <a className="whatsapp-float" href={whatsapp.url} target="_blank" rel="noreferrer" aria-label="Contact me on WhatsApp"><span>WA</span><strong>Contact me</strong></a> : null}
      {profileOpen ? <ProfileDialog content={content} settings={settings} availability={sectionAvailability} onClose={() => setProfileOpen(false)} /> : null}
      <Footer profile={profile} settings={settings} socials={content.socials} availability={sectionAvailability} />
    </div>
  )
}

