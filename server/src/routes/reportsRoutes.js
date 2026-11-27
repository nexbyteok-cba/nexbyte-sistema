import { Router } from 'express';
import { getDashboardOverview, getDetailedReports } from '../controllers/reportsController.js';

const router = Router();

router.get('/overview', getDashboardOverview);
router.get('/detailed', getDetailedReports);

export default router;
