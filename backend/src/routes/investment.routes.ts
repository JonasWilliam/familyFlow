import { Router } from 'express';
import { InvestmentController } from '../controllers/InvestmentController';

const router = Router();
const investmentController = new InvestmentController();

router.post('/', (req, res) => investmentController.create(req, res));
router.get('/:usuarioId', (req, res) => investmentController.list(req, res));
router.put('/:id', (req, res) => investmentController.update(req, res));
router.delete('/:id', (req, res) => investmentController.remove(req, res));

export default router;
