import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import path from 'path';
import { s3, S3_BUCKET } from '../config/awssdk.js';
// import { s3, S3_BUCKET } from '../config/awssdk';

export interface IUploadedFile {
  url: string;
  key: string;
  type: 'image' | 'pdf' | 'video' | "other";
  originalName: string;
  contentType: string;
  uploadedAt: Date;
}

// Generate a unique S3 key inside a folder
// const generateS3Key = (originalName: string, folder: string): string => {
const generateS3Key = (folder: string, extension: string): string => {
  // const ext = path.extname(originalName);
  const uniqueId = uuidv4();
  return `${folder}/${uniqueId}${extension}`;
};




// Upload a single file to S3 (optimizes images via sharp, keeps PDFs as-is)
// export const uploadFileToS3 = async (file: Express.Multer.File): Promise<IUploadedFile> => {
//   let fileBuffer = file.buffer;
//   let contentType = file.mimetype;
//   let folder = 'others';
//   let type: IUploadedFile['type'] = 'other';

//   if (file.mimetype.startsWith('image/')) {
//     folder = 'images';
//     type = 'image';
//     fileBuffer = await sharp(file.buffer)
//       .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
//       .jpeg({ quality: 80 })
//       .toBuffer();
//     contentType = 'image/jpeg';
//   } else if (file.mimetype === 'application/pdf') {
//     folder = 'pdfs';
//     type = 'pdf';
//   }

//   const key = generateS3Key(file.originalname, folder);

//   await s3.send(
//     new PutObjectCommand({
//       Bucket: S3_BUCKET,
//       Key: key,
//       Body: fileBuffer,
//       ContentType: contentType,
//     })
//   );

//   return {
//     url: `https://${S3_BUCKET}.s3.amazonaws.com/${key}`,
//     key,
//     type,
//     originalName: file.originalname,
//     uploadedAt: new Date(),
//   };
// };




import multer from "multer";

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
];

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images, PDFs and videos are allowed."));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});


// GIF and SVG must skip sharp's resize/format pipeline —
// resizing breaks GIF animation, and sharp rasterizes SVG rather than preserving it as vector.
const SKIP_PROCESSING_TYPES = ['image/gif', 'image/svg+xml'];

export const uploadFileToS3 = async (file: Express.Multer.File): Promise<IUploadedFile> => {
  let fileBuffer = file.buffer;
  let contentType = file.mimetype;
  let folder = 'others';
  let type: IUploadedFile['type'] = 'other';
  let extension = '';

  if (file.mimetype.startsWith('image/')) {
    folder = 'images';
    type = 'image';

    if (SKIP_PROCESSING_TYPES.includes(file.mimetype)) {
      extension = file.mimetype === 'image/gif' ? '.gif' : '.svg';
    } else {
      // Normalize every processable image to webp: preserves transparency,
      // smaller than jpeg at equivalent quality, broad browser support.
      fileBuffer = await sharp(file.buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      contentType = 'image/webp';
      extension = '.webp';
    }
  } else if (file.mimetype === 'application/pdf') {
    folder = 'pdfs';
    type = 'pdf';
    extension = '.pdf';
  } else if (file.mimetype.startsWith('video/')) {
    folder = 'videos';
    type = 'video';
    extension = '.' + (file.originalname.split('.').pop() ?? 'mp4');
  }

  const key = generateS3Key(folder, extension);

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return {
    url: `https://${S3_BUCKET}.s3.amazonaws.com/${key}`,
    key,
    type,
    originalName: file.originalname,
    contentType,
    uploadedAt: new Date(),
  };
};

// Upload multiple files in parallel (handy if you add multi-file support later)
export const processFiles = async (
  filesArray: Express.Multer.File[]
): Promise<IUploadedFile[]> => {
  if (!filesArray || filesArray.length === 0) return [];
  return Promise.all(filesArray.map((file) => uploadFileToS3(file)));
};