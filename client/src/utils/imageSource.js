export const isImageSource = (value) => {
  if (!value) return false
  if (value.startsWith('/uploads/') || value.startsWith('data:image/') || value.startsWith('blob:')) return true

  try {
    const path = new URL(value, window.location.origin).pathname.toLowerCase()
    return /\.(avif|gif|jpe?g|png|svg|webp)$/.test(path)
  } catch {
    return false
  }
}
