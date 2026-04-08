import { Router } from 'express';
import { InvoiceController } from '../controllers/InvoiceController';

const invoiceRoutes = Router();
const c = new InvoiceController();

invoiceRoutes.post('/parse', c.parse);

export default invoiceRoutes;
