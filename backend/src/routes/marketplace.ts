import { Router } from 'express';
import {
  getMarketplaceListings,
  purchaseData,
  getPurchaseHistory,
  getAccessData,
  getMarketplaceStats
} from '../controllers/marketplaceController';

const router = Router();

router.get('/marketplace/listings', getMarketplaceListings);
router.post('/marketplace/purchase', purchaseData);
router.get('/marketplace/purchases/:wallet', getPurchaseHistory);
router.get('/marketplace/access/:purchaseId', getAccessData);
router.get('/marketplace/stats', getMarketplaceStats);

export default router;