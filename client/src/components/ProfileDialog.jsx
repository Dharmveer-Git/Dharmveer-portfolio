import { useEffect, useRef } from 'react'
import SocialLinks from './SocialLinks.jsx'
import ProjectCard from './ProjectCard.jsx'

export default function ProfileDialog({ content, settings, availability, onClose }) {
  const dialog = useRef(null)
  const profile = content.profile[0]
  const about = content.about[0]
  useEffect(() => {
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement
    if (!element.open) element.showModal()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus({ preventScroll: true }) }
  }, [])

  return <dialog ref={dialog} className="profile-dialog" aria-labelledby="professional-profile-title" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="profile-dialog-inner">
      <header className="profile-dialog-header"><span className="kicker">Professional profile</span><button type="button" onClick={onClose} aria-label="Close professional profile">Close <span aria-hidden="true">×</span></button></header>
      <div className="profile-overview"><h2 id="professional-profile-title">{profile?.title || 'Professional profile'}</h2><p className="profile-role">{profile?.subtitle}</p><p>{profile?.description}</p>
        <div className="hero-actions">{settings.resumeUrl ? <><a className="primary-action" href={settings.resumeUrl} target="_blank" rel="noopener noreferrer">View Resume</a><a href={settings.resumeUrl} download>Download Resume</a></> : null}{availability.contact ? <a href="#contact" onClick={onClose}>Contact</a> : null}</div>
        <SocialLinks items={content.socials} className="profile-social-links" />
      </div>
      {availability.about && about ? <section className="profile-detail-section"><h3>About</h3><p>{about.description}</p></section> : null}
      {['experience', 'education'].filter((key) => availability[key]).map((key) => <section className="profile-detail-section" key={key}><h3>{key === 'experience' ? 'Experience' : 'Education'}</h3><div className="profile-detail-grid">{content[key].map((item) => <article key={item._id}><span>{[item.startDate, item.endDate].filter(Boolean).join(' - ')}</span><h4>{item.title}</h4><strong>{item.subtitle}</strong><p>{item.description}</p></article>)}</div>{!content[key].length ? <p>No published {key} yet.</p> : null}</section>)}
      {availability.skills ? <section className="profile-detail-section"><h3>Skills</h3><ul className="profile-skill-list">{content.skills.map((item) => <li key={item._id}>{item.title}</li>)}</ul>{!content.skills.length ? <p>No published skills yet.</p> : null}</section> : null}
      {availability.projects ? <section className="profile-detail-section"><h3>Projects</h3><div className="project-list">{content.projects.map((project, index) => <ProjectCard key={project._id} project={project} index={index} />)}</div>{!content.projects.length ? <p>No published projects yet.</p> : null}</section> : null}
    </div>
  </dialog>
}
