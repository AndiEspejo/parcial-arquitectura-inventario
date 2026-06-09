import { Router } from 'express';
import {
  listWarehouses,
  getWarehouse,
  createWarehouse,
} from '../controllers/warehousesController';

const router = Router();

router.get('/',    listWarehouses);
router.get('/:id', getWarehouse);
router.post('/',   createWarehouse);

export default router;
