import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';

const categoryRoutes = Router();
const c = new CategoryController();

categoryRoutes.post('/', (req, res) => c.create(req, res));
categoryRoutes.get('/', (req, res) => c.list(req, res));
categoryRoutes.put('/:id', (req, res) => c.update(req, res));
categoryRoutes.delete('/:id', (req, res) => c.remove(req, res));

export default categoryRoutes;
