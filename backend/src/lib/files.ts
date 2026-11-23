import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';

export const uploadsDir = () => path.resolve(env.UPLOAD_DIR);
export const imageUrlFor = (filename: string) => `/uploads/${filename}`;

export async function removeUpload(imageUrl: string | null | undefined) {
  if (!imageUrl) return;
  await fs.unlink(path.join(uploadsDir(), path.basename(imageUrl))).catch(() => {});
}

// Magic bytes: no se confía solo en el MIME que declara el cliente.
export async function isRealImage(filePath: string, mime: string) {
  const fh = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(12);
    await fh.read(buf, 0, 12, 0);
    if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    if (mime === 'image/png') return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mime === 'image/webp') return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
    return false;
  } finally {
    await fh.close();
  }
}
