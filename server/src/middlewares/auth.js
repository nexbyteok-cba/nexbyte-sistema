import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { queryOne } from '../db/index.js';

export async function authenticateToken(req, res, next) {
  try {
    let token = null;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.nexbyte_token) {
      token = req.cookies.nexbyte_token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Acceso no autorizado. Debe iniciar sesión.' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await queryOne('SELECT id, email, full_name, role, must_change_password FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado o sesión inválida.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado. Vuelva a iniciar sesión.' });
  }
}

export function requirePasswordChanged(req, res, next) {
  if (req.user && req.user.must_change_password === 1) {
    return res.status(403).json({
      error: 'Debe cambiar su contraseña inicial antes de continuar.',
      mustChangePassword: true,
    });
  }
  next();
}
