import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'erp.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Owner (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      brand TEXT,
      purchase_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_stock_alert INTEGER NOT NULL DEFAULT 5,
      unit_type TEXT NOT NULL,
      expiry_date TEXT,
      FOREIGN KEY (category_id) REFERENCES Categories(id)
    );

    CREATE TABLE IF NOT EXISTS PurchaseSpend (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name TEXT NOT NULL,
      total_amount REAL NOT NULL,
      purchase_date TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS DailyIncome (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS Expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS UdharLedger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_name TEXT NOT NULL,
      amount REAL NOT NULL,
      item_name TEXT,
      notes TEXT,
      date TEXT NOT NULL,
      due_date TEXT,
      status TEXT DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS UdharPayments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      udhar_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (udhar_id) REFERENCES UdharLedger(id) ON DELETE CASCADE
    );
  `);

  // Seed default owner if not exists
  const ownerCount = db.prepare('SELECT COUNT(*) as count FROM Owner').get() as { count: number };
  if (ownerCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO Owner (username, password) VALUES (?, ?)').run('admin', hashedPassword);
  }

  // Seed default categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM Categories').get() as { count: number };
  if (catCount.count === 0) {
    const insertCat = db.prepare('INSERT INTO Categories (name) VALUES (?)');
    ['Groceries', 'Electronics', 'Clothing', 'Stationery', 'Misc'].forEach(cat => insertCat.run(cat));
  }
}

initDB();
