import { Router } from 'express';
import { getProduct, createProduct } from '../controllers/productsController';

const router = Router();

router.get('/:id', getProduct);
router.post('/',   createProduct);

export default router;
