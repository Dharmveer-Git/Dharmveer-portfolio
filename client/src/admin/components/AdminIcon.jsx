const paths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  profile: 'M20 21v-2a7 7 0 0 0-14 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  projects: 'M3 7h7l2 2h9v11H3z M3 7V4h7l2 3',
  skills: 'M8 5 2 12l6 7 M16 5l6 7-6 7 M14 3l-4 18',
  messages: 'M3 5h18v14H3z M3 5l9 8 9-8',
  certificates: 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M9 12l-1 9 4-3 4 3-1-9',
  experience: 'M3 7h18v13H3z M8 7V3h8v4 M3 12h18 M10 12v3h4v-3',
  settings: 'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6',
  resume: 'M6 2h8l4 4v16H6z M14 2v5h4 M9 12h6 M9 16h6',
}
export default function AdminIcon({ name }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.settings} /></svg>
}
