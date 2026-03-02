import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const income = db.prepare('SELECT * FROM DailyIncome ORDER BY date DESC').all();
  res.json(income);
});

router.post('/', (req, res) => {
  const { amount, date, notes } = req.body;
  const stmt = db.prepare('INSERT INTO DailyIncome (amount, date, notes) VALUES (?, ?, ?)');
  const info = stmt.run(amount, date, notes);
  res.json({ id: info.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM DailyIncome WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
