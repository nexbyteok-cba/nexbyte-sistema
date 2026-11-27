import { Router } from 'express';
import { getOrderPayments, createPayment } from '../controllers/paymentsController.js';

const router = Router();

router.get('/order/:orderId', getOrderPayments);
router.post('/order/:orderId', createPayment);

export default router;
