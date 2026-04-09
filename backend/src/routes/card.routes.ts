import { Router } from 'express';
import { CardController } from '../controllers/CardController.js';

const router = Router();
const controller = new CardController();

router.get('/:usuarioId', (req, res) => controller.list(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.remove(req, res));

export default router;
