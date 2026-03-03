import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, c.name as category_name 
      FROM Products p 
      LEFT JOIN Categories c ON p.category_id = c.id
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, category_id, brand, purchase_price, selling_price, quantity, min_stock_alert, unit_type, expiry_date } = req.body;
    const result = await db.query(`
      INSERT INTO Products (name, category_id, brand, purchase_price, selling_price, quantity, min_stock_alert, unit_type, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `, [name, category_id, brand, purchase_price, selling_price, quantity, min_stock_alert, unit_type, expiry_date]);
    res.json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category_id, brand, purchase_price, selling_price, quantity, min_stock_alert, unit_type, expiry_date } = req.body;
    await db.query(`
      UPDATE Products 
      SET name = $1, category_id = $2, brand = $3, purchase_price = $4, selling_price = $5, quantity = $6, min_stock_alert = $7, unit_type = $8, expiry_date = $9
      WHERE id = $10
    `, [name, category_id, brand, purchase_price, selling_price, quantity, min_stock_alert, unit_type, expiry_date, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Categories');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
