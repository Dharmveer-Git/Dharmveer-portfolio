import { isValidSocialLink } from '../utils/socialLinks.js'
import SocialIcon from './SocialIcon.jsx'

const selectLinks = (items = [], platforms) => platforms
  .map((platform) => items.find((item) => item.title?.toLowerCase() === platform.toLowerCase()))
  .filter(isValidSocialLink)

const Arrow = () => <span aria-hidden="true">↗</span>

export default function Footer({ profile, settings, socials = [], availability = {} }) {
  const footer = settings.footer || {}
  const visible = (section) => footer.sections?.[section] !== false
  const savedLinks = Object.entries(footer.links || {}).map(([key, value]) => ({ _id: key, title: key, label: value.label || key, url: value.url, active: value.visible }))
  const configuredLinks = savedLinks.length ? savedLinks.map((item) => ({ ...item, url: item.url || socials.find((social) => social.title?.toLowerCase() === item.title.toLowerCase())?.url || '' })) : socials
  const sourceLinks = [...configuredLinks, ...socials.filter((social) => !configuredLinks.some((item) => item.title.toLowerCase() === social.title.toLowerCase()))]
  const professionalLinks = selectLinks(sourceLinks, ['GitHub', 'LinkedIn', 'Indeed', 'Naukri', 'Upwork', 'Turing'])
  const contactLinks = selectLinks(sourceLinks, ['Email', 'WhatsApp', 'YouTube', 'Facebook'])
  const quickLinks = [
    ['Home', '#top', true],
    ['About', '#about', availability.about !== false],
    ['Projects', '#work', availability.projects !== false],
    ['Contact', '#contact', availability.contact !== false],
  ].filter(([, , visible]) => visible)

  const returnToTop = (event) => {
    event.preventDefault()
    const top = document.getElementById('top')
    top?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    top?.setAttribute('tabindex', '-1')
    top?.focus({ preventScroll: true })
  }

  return <footer className="site-footer">
    <div className={`footer-main ${professionalLinks.length ? '' : 'footer-main-compact'}`}>
      {visible('identity') ? <div className="footer-identity">
        <a className="footer-mark" href="#top" aria-label="Back to top" onClick={returnToTop}>{footer.logoUrl ? <img src={footer.logoUrl} alt={footer.logoAlt || 'Footer logo'} /> : settings.logoName}</a>
        <h2>{footer.developerName || profile?.title || settings.copyrightText}</h2>
        <p>{profile?.subtitle || 'Full Stack Developer'}</p>
        <small>{footer.shortDescription || profile?.description || 'I build fast, accessible, and dependable web products—from polished interfaces to secure backend systems.'}</small>
      </div> : null}
      {visible('quickLinks') ? <nav className="footer-column" aria-label="Footer quick links">
        <h3>{footer.quickLinksHeading || 'Quick Links'}</h3>
        {quickLinks.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
      </nav> : null}
      {visible('professional') && professionalLinks.length ? <nav className="footer-column" aria-label="Professional profiles">
        <h3>{footer.professionalHeading || 'Professional'}</h3>
        {professionalLinks.map((item) => <a key={item._id} href={item.url} target="_blank" rel="noopener noreferrer"><SocialIcon item={item} size={22} />{item.label || item.title}<Arrow /></a>)}
      </nav> : null}
    </div>
    {visible('socialRow') && contactLinks.length ? <nav className="footer-contact-row" aria-label="Contact and social links">
      {contactLinks.map((item) => {
        const external = !item.url.startsWith('mailto:')
        return <a key={item._id} href={item.url} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><SocialIcon item={item} size={28} />{item.label || item.title}</a>
      })}
    </nav> : null}
    <div className="footer-bottom">
      {visible('copyright') ? <span>&copy; {footer.useCurrentYear !== false ? new Date().getFullYear() : ''} {footer.copyrightText || settings.copyrightText}</span> : null}
      <div>{visible('privacy') ? <a href={footer.privacyUrl || '/privacy'}>{footer.privacyLabel || 'Privacy'}</a> : null}{visible('backToTop') ? <a href="#top" onClick={returnToTop}>Back to Top <span aria-hidden="true">↑</span></a> : null}</div>
    </div>
  </footer>
}
