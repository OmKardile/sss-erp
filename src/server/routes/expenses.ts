import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const expenses = db.prepare('SELECT * FROM Expenses ORDER BY date DESC').all();
  res.json(expenses);
});

router.post('/', (req, res) => {
  const { category, amount, date, notes } = req.body;
  const stmt = db.prepare('INSERT INTO Expenses (category, amount, date, notes) VALUES (?, ?, ?, ?)');
  const info = stmt.run(category, amount, date, notes);
  res.json({ id: info.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM Expenses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
