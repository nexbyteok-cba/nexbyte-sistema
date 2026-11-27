import { Router } from 'express';
import { getSettings, updateSettings, addBrand, addServiceCategory } from '../controllers/settingsController.js';

const router = Router();

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/brands', addBrand);
router.post('/services', addServiceCategory);

export default router;
