import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM DailyIncome ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amount, date, notes } = req.body;
    const result = await db.query(
      'INSERT INTO DailyIncome (amount, date, notes) VALUES ($1, $2, $3) RETURNING id',
      [amount, date, notes]
    );
    res.json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM DailyIncome WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
