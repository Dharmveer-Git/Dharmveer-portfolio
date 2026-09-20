import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";

import multer from "multer";

// Upload directory
export const uploadDirectory = path.resolve(
  process.env.UPLOAD_DIR || "server/uploads"
);

// Create upload directory if it doesn't exist
mkdirSync(uploadDirectory, {
  recursive: true,
});

// Allowed MIME types and file extensions
const extensions = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["application/pdf", ".pdf"],
]);

// Configure file storage
const storage = multer.diskStorage({
  destination: uploadDirectory,

  filename: (_request, file, callback) => {
    const extension =
      extensions.get(file.mimetype) || "";

    const filename = `${Date.now()}-${randomUUID()}${extension}`;

    callback(null, filename);
  },
});

// Configure Multer
const upload = multer({
  storage,

  // Maximum file size: 10 MB
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },

  // Validate file type
  fileFilter: (_request, file, callback) => {
    if (!extensions.has(file.mimetype)) {
      return callback(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          "file"
        )
      );
    }

    return callback(null, true);
  },
});

export default upload;