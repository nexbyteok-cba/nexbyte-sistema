import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { queryOne, execute } from '../db/index.js';
import { logAudit } from '../utils/audit.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo electrónico y contraseña requeridos.' });
    }

    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logAudit({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'users',
        entityId: user.id,
        req,
      });
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Set HttpOnly cookie
    res.cookie('nexbyte_token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await logAudit({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'users',
      entityId: user.id,
      req,
    });

    return res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        must_change_password: Boolean(user.must_change_password),
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: 'Error interno del servidor en inicio de sesión.' });
  }
}

export async function logout(req, res) {
  try {
    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'LOGOUT',
        entityType: 'users',
        entityId: req.user.id,
        req,
      });
    }
    res.clearCookie('nexbyte_token');
    return res.json({ message: 'Sesión cerrada con éxito.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al cerrar sesión.' });
  }
}

export async function getMe(req, res) {
  try {
    return res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role,
        must_change_password: Boolean(req.user.must_change_password),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener perfil.' });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Debe ingresar la contraseña actual y la nueva contraseña.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPassword, salt);
    const now = new Date().toISOString();

    await execute(
      'UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?',
      [newHash, now, user.id]
    );

    await logAudit({
      userId: user.id,
      action: 'CHANGE_PASSWORD',
      entityType: 'users',
      entityId: user.id,
      req,
    });

    return res.json({
      message: 'Contraseña actualizada exitosamente. Ya puede operar con normalidad.',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        must_change_password: false,
      },
    });
  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    return res.status(500).json({ error: 'Error al actualizar contraseña.' });
  }
}
