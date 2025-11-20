import { Router } from 'express';
import { createReading, getReadings, getReadingsByNode } from '../controllers/readingsController';

const router = Router();

router.post('/readings', createReading);
router.get('/readings', getReadings);
router.get('/readings/:nodeId', getReadingsByNode);

export default router;