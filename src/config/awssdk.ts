//  config/awssdk.ts 
import { S3Client , GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dotenv from 'dotenv';
dotenv.config();

export const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET as string;



//  since the bucket is public we dont need tow things seeprate 
export const getSignedUrlForKey = async (key: string, originalName?: string) => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ResponseContentDisposition: originalName
      ? `attachment; filename="${originalName}"`
      : "attachment",
  });

  // v3: presigning is a standalone function, not a client method
  return getSignedUrl(s3, command, { expiresIn: 60 * 15 }); // seconds, same 15 min
};



// if the bucket is private then we need to use these two 


// // For viewing inline (images/videos in the UI) — no forced download
// export const getSignedViewUrl = async (key: string) => {
//   const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
//   return getSignedUrl(s3, command, { expiresIn: 60 * 15 });
// };

// // For explicit downloads — forces "Save As" with the original filename
// and this "getSignedDownloadUrl" will be used in the download controller instead of "getSignedUrlForKey"

// export const getSignedDownloadUrl = async (key: string, originalName?: string) => {
//   const command = new GetObjectCommand({
//     Bucket: S3_BUCKET,
//     Key: key,
//     ResponseContentDisposition: originalName
//       ? `attachment; filename="${originalName}"`
//       : 'attachment',
//   });
//   return getSignedUrl(s3, command, { expiresIn: 60 * 15 });
// };