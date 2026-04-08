import { Router } from 'express';
import { SettingController } from '../controllers/SettingController';

const router = Router();
const controller = new SettingController();

// Frontend chama GET /api/settings para carregar tudo
router.get('/', (req, res) => controller.list(req, res));

// Frontend chama POST /api/settings/update para salvar
router.post('/update', (req, res) => controller.update(req, res));

// Rota extra para buscar chave específica
router.get('/:key', (req, res) => controller.get(req, res));

export default router;
