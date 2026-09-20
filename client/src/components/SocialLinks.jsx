import { isValidSocialLink } from '../utils/socialLinks.js'
import SocialIcon from './SocialIcon.jsx'

export default function SocialLinks({ items, className = 'social-links', compact = false }) {
  const visibleItems = items.filter(isValidSocialLink)
  if (!visibleItems.length) return null

  return (
    <div className={className} aria-label="Professional profiles">
      {visibleItems.map((item) => (
        <a key={item._id} href={item.url} target="_blank" rel="noopener noreferrer" aria-label={item.title}>
          {compact ? <SocialIcon item={item} /> : <><SocialIcon item={item} size={24} /> {item.title}</>}
          {!compact ? <span aria-hidden="true">↗</span> : null}
        </a>
      ))}
    </div>
  )
}
