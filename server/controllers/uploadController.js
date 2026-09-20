import { open, unlink } from 'node:fs/promises'

const signatures = {
  'image/jpeg': (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/png': (bytes) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (bytes) => bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP',
  'application/pdf': (bytes) => bytes.subarray(0, 5).toString() === '%PDF-',
}

async function hasValidSignature(file) {
  const handle = await open(file.path, 'r')
  try {
    const buffer = Buffer.alloc(12)
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    return signatures[file.mimetype]?.(buffer.subarray(0, bytesRead)) || false
  } finally {
    await handle.close()
  }
}

export async function uploadFile(request, response, next) {
  try {
    if (!request.file) return response.status(400).json({ message: 'Choose an image or PDF file.' })
    if (!(await hasValidSignature(request.file))) {
      await unlink(request.file.path).catch(() => {})
      return response.status(400).json({ message: 'File contents do not match the selected file type.' })
    }
    return response.status(201).json({ url: `/uploads/${request.file.filename}` })
  } catch (error) {
    if (request.file?.path) await unlink(request.file.path).catch(() => {})
    return next(error)
  }
}
