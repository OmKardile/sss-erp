import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const purchases = db.prepare('SELECT * FROM PurchaseSpend ORDER BY purchase_date DESC').all();
  res.json(purchases);
});

router.post('/', (req, res) => {
  const { supplier_name, total_amount, purchase_date, notes } = req.body;
  const stmt = db.prepare('INSERT INTO PurchaseSpend (supplier_name, total_amount, purchase_date, notes) VALUES (?, ?, ?, ?)');
  const info = stmt.run(supplier_name, total_amount, purchase_date, notes);
  res.json({ id: info.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM PurchaseSpend WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
