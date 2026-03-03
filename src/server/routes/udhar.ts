import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.*, 
      (SELECT COALESCE(SUM(amount), 0) FROM UdharPayments WHERE udhar_id = u.id) as paid_amount
      FROM UdharLedger u
      ORDER BY u.date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { person_name, amount, item_name, notes, date, due_date } = req.body;
    const result = await db.query(
      'INSERT INTO UdharLedger (person_name, amount, item_name, notes, date, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [person_name, amount, item_name, notes, date, due_date]
    );
    res.json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { person_name, amount, item_name, notes, date, due_date, status } = req.body;
    await db.query(
      'UPDATE UdharLedger SET person_name = $1, amount = $2, item_name = $3, notes = $4, date = $5, due_date = $6, status = $7 WHERE id = $8',
      [person_name, amount, item_name, notes, date, due_date, status, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM UdharLedger WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/payments', async (req, res) => {
  try {
    const { amount, date } = req.body;
    const result = await db.query(
      'INSERT INTO UdharPayments (udhar_id, amount, date) VALUES ($1, $2, $3) RETURNING id',
      [req.params.id, amount, date]
    );

    // Check if fully paid
    const udharRes = await db.query('SELECT amount FROM UdharLedger WHERE id = $1', [req.params.id]);
    const udhar = udharRes.rows[0];

    const paidRes = await db.query('SELECT SUM(amount) as total FROM UdharPayments WHERE udhar_id = $1', [req.params.id]);
    const paid = paidRes.rows[0];

    if (parseFloat(paid.total || 0) >= parseFloat(udhar.amount || 0)) {
      await db.query("UPDATE UdharLedger SET status = 'PAID' WHERE id = $1", [req.params.id]);
    }

    res.json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/payments', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM UdharPayments WHERE udhar_id = $1 ORDER BY date DESC', [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
