import { Router } from 'express';
import { getInventory, createItem, adjustStock, getItemMovements } from '../controllers/inventoryController.js';

const router = Router();

router.get('/', getInventory);
router.post('/', createItem);
router.post('/:id/adjust', adjustStock);
router.get('/:id/movements', getItemMovements);

export default router;
