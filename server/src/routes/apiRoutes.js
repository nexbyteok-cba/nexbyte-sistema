import { Router } from 'express';
import authRoutes from './authRoutes.js';
import clientsRoutes from './clientsRoutes.js';
import appointmentsRoutes from './appointmentsRoutes.js';
import receptionRoutes from './receptionRoutes.js';
import ordersRoutes from './ordersRoutes.js';
import paymentsRoutes from './paymentsRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import cashRoutes from './cashRoutes.js';
import financesRoutes from './financesRoutes.js';
import reportsRoutes from './reportsRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import { authenticateToken, requirePasswordChanged } from '../middlewares/auth.js';

const router = Router();

// Rutas públicas de autenticación
router.use('/auth', authRoutes);

// Rutas operativas protegidas con JWT / Cookie segura
router.use('/clients', authenticateToken, requirePasswordChanged, clientsRoutes);
router.use('/appointments', authenticateToken, requirePasswordChanged, appointmentsRoutes);
router.use('/reception', authenticateToken, requirePasswordChanged, receptionRoutes);
router.use('/orders', authenticateToken, requirePasswordChanged, ordersRoutes);
router.use('/payments', authenticateToken, requirePasswordChanged, paymentsRoutes);
router.use('/inventory', authenticateToken, requirePasswordChanged, inventoryRoutes);
router.use('/cash', authenticateToken, requirePasswordChanged, cashRoutes);
router.use('/finances', authenticateToken, requirePasswordChanged, financesRoutes);
router.use('/reports', authenticateToken, requirePasswordChanged, reportsRoutes);
router.use('/settings', authenticateToken, requirePasswordChanged, settingsRoutes);

export default router;
