import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import memberRoutes from './routes/member.routes';
import categoryRoutes from './routes/category.routes';
import invoiceRoutes from './routes/invoice.routes';
import settingRoutes from './routes/setting.routes';
import investmentRoutes from './routes/investment.routes';
import cardRoutes from './routes/card.routes';

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Monitoramento básico para Vercel
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/cards', cardRoutes);

export { app };
