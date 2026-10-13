import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const AUDIO_DIR = path.join(process.cwd(), 'uploads', 'audio');

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const ALLOWED_AUDIO = new Set([
  'audio/webm',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'video/webm',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AUDIO_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const audioUploadMiddleware = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max audio
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = ['.webm', '.wav', '.mp3', '.mp4', '.ogg', '.m4a'];
    if (!allowedExt.includes(ext) && !ALLOWED_AUDIO.has(file.mimetype)) {
      cb(new Error(`Audio format not supported: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

export { AUDIO_DIR };
