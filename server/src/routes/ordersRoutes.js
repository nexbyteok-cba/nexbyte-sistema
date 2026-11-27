import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  saveDiagnostic,
  addAuthorization,
  addOrderPart,
  processDelivery,
} from '../controllers/ordersController.js';

const router = Router();

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/diagnostic', saveDiagnostic);
router.post('/:id/authorizations', addAuthorization);
router.post('/:id/parts', addOrderPart);
router.post('/:id/delivery', processDelivery);

export default router;
