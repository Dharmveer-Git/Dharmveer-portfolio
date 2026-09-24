import { Link } from 'react-router-dom'
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const Arrow = () => <span aria-hidden="true">↗</span>

export default function ProjectCard({ project, index }) {
  return (
    <article className="project">
      <div className={`project-art tone-${index % 3}`}>
        {project.image ? <img src={project.image} alt={`${project.title} screenshot`} loading="lazy" decoding="async" /> : null}
        <span>{project.featured ? 'Featured project' : String(index + 1).padStart(2, '0')}</span>
        {!project.image ? <div className="mockup" aria-hidden="true"><div className="dots"><i /><i /><i /></div><div className="blocks"><i /><i /><i /></div></div> : null}
      </div>
      <div className="project-copy">
        <p className="kicker">{project.subtitle || 'Software project'}</p>
        <h3>{project.title}</h3>
        <p className="project-summary">{project.description}</p>
        <ul aria-label="Technologies">{project.tags?.map((tag) => <li key={tag}>{tag}</li>)}</ul>
        <div className="project-links">
          <Link className="details-link" to={`/projects/${slugify(project.title)}`} aria-label={`View details for ${project.title}`}>Read case study <Arrow /></Link>
          {project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">Live Demo <Arrow /></a> : null}
          {project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">GitHub <Arrow /></a> : null}
        </div>
      </div>
    </article>
  )
}
