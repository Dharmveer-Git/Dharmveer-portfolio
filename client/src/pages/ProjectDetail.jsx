import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { contentApi } from '../api/api.js'
import Arrow from '../components/Arrow.jsx'
import NotFound from './NotFound.jsx'

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
export default function ProjectDetail() {
  const { slug } = useParams()
  return <ProjectContent key={slug} slug={slug} />
}

function ProjectContent({ slug }) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    window.scrollTo(0, 0)
    contentApi.list('projects')
      .then((items) => { if (!cancelled) setProject(items.find((item) => slugify(item.title) === slug) || null) })
      .catch(() => { if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug, attempt])

  if (loading) return <main className="case-study" aria-busy="true"><p role="status">Loading project details...</p></main>
  if (failed) return <main className="case-study"><Link className="case-back" to="/#work">Back to projects</Link><h1>Project temporarily unavailable</h1><p>We could not load this project. Please try again.</p><button className="case-retry" onClick={() => { setLoading(true); setFailed(false); setAttempt((value) => value + 1) }}>Try again</button></main>
  if (!project) return <NotFound />

  return (
    <main className="case-study">
      <Link className="case-back" to="/#work">Back to all projects</Link>
      <header>
        <p className="kicker">{project.subtitle || 'Project overview'}</p>
        <h1>{project.title}</h1>
        <div className="project-links">{project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">Live Demo <Arrow /></a> : null}{project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">GitHub <Arrow /></a> : null}</div>
      </header>
      {project.image ? <figure className="case-image"><img src={project.image} alt={`${project.title} screenshot`} /></figure> : null}
      <section className="case-overview" aria-labelledby="overview-title"><h2 id="overview-title">Overview</h2><p>{project.description}</p></section>
      <div className="case-grid">
        {project.meta?.problem ? <section><h2>The problem</h2><p>{project.meta.problem}</p></section> : null}
        {project.meta?.solution ? <section><h2>The solution</h2><p>{project.meta.solution}</p></section> : null}
        {project.tags?.length ? <section><h2>Tech stack</h2><ul className="case-tags">{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></section> : null}
        {project.features?.length ? <section><h2>Key features</h2><ul>{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></section> : null}
      </div>
      {project.meta?.learning ? <section className="case-learning"><p className="kicker">Engineering reflection</p><h2>What I learned</h2><p>{project.meta.learning}</p></section> : null}
    </main>
  )
}
