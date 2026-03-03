import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/erp',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize schema
export async function initDB() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS Owner (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category_id INTEGER REFERENCES Categories(id),
      brand TEXT,
      purchase_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_stock_alert INTEGER NOT NULL DEFAULT 5,
      unit_type TEXT NOT NULL,
      expiry_date TEXT
    );

    CREATE TABLE IF NOT EXISTS PurchaseSpend (
      id SERIAL PRIMARY KEY,
      supplier_name TEXT NOT NULL,
      total_amount REAL NOT NULL,
      purchase_date TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS DailyIncome (
      id SERIAL PRIMARY KEY,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS Expenses (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS UdharLedger (
      id SERIAL PRIMARY KEY,
      person_name TEXT NOT NULL,
      amount REAL NOT NULL,
      item_name TEXT,
      notes TEXT,
      date TEXT NOT NULL,
      due_date TEXT,
      status TEXT DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS UdharPayments (
      id SERIAL PRIMARY KEY,
      udhar_id INTEGER NOT NULL REFERENCES UdharLedger(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      date TEXT NOT NULL
    );
  `);

  // Seed default owner if not exists
  const ownerCount = await db.query('SELECT COUNT(*) as count FROM Owner');
  if (parseInt(ownerCount.rows[0].count) === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await db.query('INSERT INTO Owner (username, password) VALUES ($1, $2)', ['admin', hashedPassword]);
  }

  // Seed default categories
  const catCount = await db.query('SELECT COUNT(*) as count FROM Categories');
  if (parseInt(catCount.rows[0].count) === 0) {
    const categories = ['Groceries', 'Electronics', 'Clothing', 'Stationery', 'Misc'];
    for (const cat of categories) {
      await db.query('INSERT INTO Categories (name) VALUES ($1)', [cat]);
    }
  }
}

initDB().catch(console.error);
