import { Router } from 'express';
import {
  registerNode,
  getAllNodes,
  getNodeById,
  updateNode,
  activateNode,
  getNodeStats
} from '../controllers/nodeController';

const router = Router();

router.post('/nodes', registerNode);
router.get('/nodes', getAllNodes);
router.get('/nodes/:nodeId', getNodeById);
router.put('/nodes/:nodeId', updateNode);
router.post('/nodes/:nodeId/activate', activateNode);
router.get('/nodes/:nodeId/stats', getNodeStats);

export default router;