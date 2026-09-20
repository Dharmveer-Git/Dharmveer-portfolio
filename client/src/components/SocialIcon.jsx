import { useState } from 'react'
import { isImageSource } from '../utils/imageSource.js'

const icons = {
  github: <path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-3c3.3-.4 6-1.6 6-6a4.7 4.7 0 0 0-1.3-3.3A4.3 4.3 0 0 0 18.6 2S17.3 1.6 15 3a12 12 0 0 0-6 0C6.7 1.6 5.4 2 5.4 2a4.3 4.3 0 0 0-.1 3.7A4.7 4.7 0 0 0 4 9c0 4.4 2.7 5.6 6 6a3.5 3.5 0 0 0-1 3v4" />,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 10v7m0-10v.01M11 17v-7m0 3a3 3 0 0 1 6 0v4" /></>,
  email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
  youtube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" /></>,
  facebook: <path d="M14 22V13h3l1-4h-4V6c0-1 1-2 2-2h2V1h-3c-3 0-5 2-5 5v3H7v4h3v9" />,
  whatsapp: <><path d="M21 11.5a9 9 0 0 1-13.4 8L3 21l1.5-4.6A9 9 0 1 1 21 11.5Z" /><path d="M8 7c-2 3 3 8 6 8l2-2-3-2-1 1-2-2 1-1-2-2Z" /></>,
}

export default function SocialIcon({ item, size = 38 }) {
  const [failedSource, setFailedSource] = useState('')
  const label = item?.title || 'Profile'
  const initials = label.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase()
  const image = isImageSource(item?.image) && item.image !== failedSource ? item.image : ''
  const icon = icons[label.toLowerCase()]
  return <span className="social-icon" style={{ '--social-icon-size': `${size}px` }} aria-hidden="true">
    {image ? <img src={image} alt="" loading="lazy" onError={() => setFailedSource(image)} /> : icon ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icon}</svg> : <b>{initials}</b>}
  </span>
}
