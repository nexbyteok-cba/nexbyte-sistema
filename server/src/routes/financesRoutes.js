import { Router } from 'express';
import { getFinancialMovements, createFinancialMovement } from '../controllers/financesController.js';

const router = Router();

router.get('/', getFinancialMovements);
router.post('/', createFinancialMovement);

export default router;
