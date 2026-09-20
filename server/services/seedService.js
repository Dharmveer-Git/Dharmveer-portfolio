import ContentItem from '../models/ContentItem.js'

const initialContent = {
  profile: [{
    title: 'Dharmveer Kumar',
    subtitle: 'Full Stack Developer',
    description: 'A full-stack engineer building fast interfaces, secure APIs, and dependable database-driven products.',
    location: 'India',
    meta: { headline: 'I engineer products people trust to use.' },
  }],
  about: [{
    title: 'Strong engineering should feel simple on the other side.',
    description: 'I work across the stack, from accessible React interfaces to secure Express APIs and MongoDB data models. My focus is maintainable code, thoughtful UX, and products teams can confidently build on.',
  }],
  skills: [
    'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Java', 'Spring Boot', 'Git',
  ].map((title) => ({ title })),
  services: [
    { title: 'Frontend engineering' },
    { title: 'Backend API development' },
    { title: 'Full-stack product development' },
  ],
}

export async function ensureInitialContent() {
  for (const [resource, items] of Object.entries(initialContent)) {
    if (await ContentItem.exists({ resource })) continue
    await ContentItem.insertMany(items.map((item, order) => ({
      ...item,
      resource,
      order,
      active: true,
    })))
  }
}

export default ensureInitialContent
