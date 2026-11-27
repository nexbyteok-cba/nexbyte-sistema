import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  turso: {
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
    localPath: process.env.LOCAL_DB_PATH || './nexbyte.db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'nexbyte_default_jwt_secret_must_change',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieSecret: process.env.COOKIE_SECRET || 'nexbyte_cookie_secret_key',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'nexbyte.ok@gmail.com',
    initialPassword: process.env.ADMIN_INITIAL_PASSWORD || 'Nexbyte2026!Admin',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  timezone: process.env.TIMEZONE || 'America/Argentina/Cordoba',
};
