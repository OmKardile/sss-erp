import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Expenses ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { category, amount, date, notes } = req.body;
    const result = await db.query(
      'INSERT INTO Expenses (category, amount, date, notes) VALUES ($1, $2, $3, $4) RETURNING id',
      [category, amount, date, notes]
    );
    res.json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Expenses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
