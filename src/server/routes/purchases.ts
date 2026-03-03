import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM PurchaseSpend ORDER BY purchase_date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { supplier_name, total_amount, purchase_date, notes } = req.body;
    const result = await db.query(
      'INSERT INTO PurchaseSpend (supplier_name, total_amount, purchase_date, notes) VALUES ($1, $2, $3, $4) RETURNING id',
      [supplier_name, total_amount, purchase_date, notes]
    );
    res.json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM PurchaseSpend WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
