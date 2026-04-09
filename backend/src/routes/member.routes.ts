import { Router } from 'express';
import { MemberController } from '../controllers/MemberController.js';

const memberRoutes = Router();
const c = new MemberController();

memberRoutes.post('/', (req, res) => c.create(req, res));
memberRoutes.get('/:usuarioId', (req, res) => c.list(req, res));
memberRoutes.put('/:id', (req, res) => c.update(req, res));
memberRoutes.delete('/:id', (req, res) => c.remove(req, res));

export default memberRoutes;
