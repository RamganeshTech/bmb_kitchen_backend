// import multer from 'multer';

// // Just parses multipart/form-data into memory.
// // No S3 logic here — that's handled inside the controller.
// export const parseFormData = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 10 * 1024 * 1024 }, // 5MB
// });


// middlewares/upload.middleware.ts
import multer, { type FileFilterCallback } from 'multer';
import type { Request, Response, NextFunction } from 'express';

const ALLOWED_MIME_TYPES = [
  // images
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  // documents
  'application/pdf',
  // video
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
];

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

export const parseFormData = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB — covers video; images/pdf are far smaller anyway
});

// Multer throws its own error type for size-limit violations — without this,
// the request just hangs or crashes with an unhandled error.
export const handleUploadError = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ ok: false, message: err.message });
  }
  if (err instanceof Error) {
    return res.status(400).json({ ok: false, message: err.message });
  }
  next(err);
};