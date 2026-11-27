import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local upload directories exist
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Cloudinary if credentials are provided
const hasCloudinary = Boolean(
  config.cloudinary.cloudName &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  console.log('☁️ Almacenamiento Cloudinary configurado');
} else {
  console.log('📁 Usando almacenamiento local persistente de archivos (uploads/)');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `order-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
});

export async function processUploadedFile(file) {
  if (hasCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'nexbyte/orders',
      });
      // Delete temporary local file after successful Cloudinary upload
      try { fs.unlinkSync(file.path); } catch {}
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (err) {
      console.error('Error subiendo a Cloudinary, usando archivo local:', err.message);
    }
  }

  // Fallback to local URL served statically
  return {
    url: `/uploads/${file.filename}`,
    publicId: file.filename,
  };
}
