import { Router } from 'express';
import { getCurrentCashSession, openCashSession, closeCashSession, addCashMovement } from '../controllers/cashController.js';

const router = Router();

router.get('/current', getCurrentCashSession);
router.post('/open', openCashSession);
router.post('/close', closeCashSession);
router.post('/movement', addCashMovement);

export default router;
