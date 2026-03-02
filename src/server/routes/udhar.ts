import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const udhar = db.prepare(`
    SELECT u.*, 
    (SELECT COALESCE(SUM(amount), 0) FROM UdharPayments WHERE udhar_id = u.id) as paid_amount
    FROM UdharLedger u
    ORDER BY u.date DESC
  `).all();
  res.json(udhar);
});

router.post('/', (req, res) => {
  const { person_name, amount, item_name, notes, date, due_date } = req.body;
  const stmt = db.prepare('INSERT INTO UdharLedger (person_name, amount, item_name, notes, date, due_date) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(person_name, amount, item_name, notes, date, due_date);
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { person_name, amount, item_name, notes, date, due_date, status } = req.body;
  const stmt = db.prepare('UPDATE UdharLedger SET person_name = ?, amount = ?, item_name = ?, notes = ?, date = ?, due_date = ?, status = ? WHERE id = ?');
  stmt.run(person_name, amount, item_name, notes, date, due_date, status, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM UdharLedger WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/payments', (req, res) => {
  const { amount, date } = req.body;
  const stmt = db.prepare('INSERT INTO UdharPayments (udhar_id, amount, date) VALUES (?, ?, ?)');
  const info = stmt.run(req.params.id, amount, date);
  
  // Check if fully paid
  const udhar = db.prepare('SELECT amount FROM UdharLedger WHERE id = ?').get(req.params.id) as any;
  const paid = db.prepare('SELECT SUM(amount) as total FROM UdharPayments WHERE udhar_id = ?').get(req.params.id) as any;
  
  if (paid.total >= udhar.amount) {
    db.prepare("UPDATE UdharLedger SET status = 'PAID' WHERE id = ?").run(req.params.id);
  }
  
  res.json({ id: info.lastInsertRowid });
});

router.get('/:id/payments', (req, res) => {
  const payments = db.prepare('SELECT * FROM UdharPayments WHERE udhar_id = ? ORDER BY date DESC').all(req.params.id);
  res.json(payments);
});

export default router;
