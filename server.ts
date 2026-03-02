import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import { db } from './src/server/db.js';
import authRoutes from './src/server/routes/auth.js';
import productRoutes from './src/server/routes/products.js';
import purchaseRoutes from './src/server/routes/purchases.js';
import incomeRoutes from './src/server/routes/income.js';
import expenseRoutes from './src/server/routes/expenses.js';
import udharRoutes from './src/server/routes/udhar.js';
import dashboardRoutes from './src/server/routes/dashboard.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/purchases', purchaseRoutes);
  app.use('/api/income', incomeRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/udhar', udharRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
