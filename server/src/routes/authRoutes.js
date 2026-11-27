import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, getMe, changePassword } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Max 10 intentos
  message: { error: 'Demasiados intentos de inicio de sesión. Por seguridad intente en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);
router.post('/change-password', authenticateToken, changePassword);

export default router;
