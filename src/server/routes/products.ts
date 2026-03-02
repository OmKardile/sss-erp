import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM Products p 
    LEFT JOIN Categories c ON p.category_id = c.id
  `).all();
  res.json(products);
});

router.post('/', (req, res) => {
  const { name, category_id, brand, purchase_price, selling_price, quantity, min_stock_alert, unit_type, expiry_date } = req.body;
  const stmt = db.prepare(`
    INSERT INTO Products (name, category_id, brand, purchase_price, selling_price, quantity, min_stock_alert, unit_type, expiry_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(name, category_id, brand, purchase_price, selling_price, quantity, min_stock_alert, unit_type, expiry_date);
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { name, category_id, brand, purchase_price, selling_price, quantity, min_stock_alert, unit_type, expiry_date } = req.body;
  const stmt = db.prepare(`
    UPDATE Products 
    SET name = ?, category_id = ?, brand = ?, purchase_price = ?, selling_price = ?, quantity = ?, min_stock_alert = ?, unit_type = ?, expiry_date = ?
    WHERE id = ?
  `);
  stmt.run(name, category_id, brand, purchase_price, selling_price, quantity, min_stock_alert, unit_type, expiry_date, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM Products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM Categories').all();
  res.json(categories);
});

export default router;
