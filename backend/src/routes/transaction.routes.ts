import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController.js';

const transactionRoutes = Router();
const c = new TransactionController();

transactionRoutes.post('/', (req, res) => c.create(req, res));
transactionRoutes.get('/:usuarioId', (req, res) => c.list(req, res));
transactionRoutes.put('/:id', (req, res) => c.update(req, res));
transactionRoutes.delete('/:id', (req, res) => c.remove(req, res));

export default transactionRoutes;
