import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/summary', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  // Today Income
  const todayIncome = (db.prepare('SELECT SUM(amount) as total FROM DailyIncome WHERE date = ?').get(today) as any).total || 0;
  
  // Today Expenses
  const todayExpenses = (db.prepare('SELECT SUM(amount) as total FROM Expenses WHERE date = ?').get(today) as any).total || 0;

  // Monthly Income
  const monthlyIncome = (db.prepare('SELECT SUM(amount) as total FROM DailyIncome WHERE date LIKE ?').get(`${currentMonth}%`) as any).total || 0;
  
  // Monthly Expenses
  const monthlyExpenses = (db.prepare('SELECT SUM(amount) as total FROM Expenses WHERE date LIKE ?').get(`${currentMonth}%`) as any).total || 0;
  
  // Monthly Purchases
  const monthlyPurchases = (db.prepare('SELECT SUM(total_amount) as total FROM PurchaseSpend WHERE purchase_date LIKE ?').get(`${currentMonth}%`) as any).total || 0;

  // Monthly Profit
  const monthlyProfit = monthlyIncome - monthlyExpenses - monthlyPurchases;

  // Total Inventory Value
  const inventoryValue = (db.prepare('SELECT SUM(purchase_price * quantity) as total FROM Products').get() as any).total || 0;

  // Pending Udhar
  const totalUdhar = (db.prepare("SELECT SUM(amount) as total FROM UdharLedger WHERE status = 'PENDING'").get() as any).total || 0;
  const totalPaidUdhar = (db.prepare(`
    SELECT SUM(p.amount) as total 
    FROM UdharPayments p 
    JOIN UdharLedger u ON p.udhar_id = u.id 
    WHERE u.status = 'PENDING'
  `).get() as any).total || 0;
  const pendingUdhar = totalUdhar - totalPaidUdhar;

  res.json({
    todayIncome,
    todayExpenses,
    monthlyProfit,
    monthlyPurchases,
    inventoryValue,
    pendingUdhar
  });
});

router.get('/charts', (req, res) => {
  // Last 30 days income
  const last30DaysIncome = db.prepare(`
    SELECT date, SUM(amount) as total 
    FROM DailyIncome 
    WHERE date >= date('now', '-30 days') 
    GROUP BY date 
    ORDER BY date ASC
  `).all();

  // Expense distribution
  const expenseDistribution = db.prepare(`
    SELECT category as name, SUM(amount) as value 
    FROM Expenses 
    GROUP BY category
  `).all();

  // Monthly P/L comparison (last 6 months)
  const monthlyPL = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(amount) as income
    FROM DailyIncome
    WHERE date >= date('now', '-6 months')
    GROUP BY month
  `).all();

  const monthlyExp = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(amount) as expenses
    FROM Expenses
    WHERE date >= date('now', '-6 months')
    GROUP BY month
  `).all();

  const monthlyPur = db.prepare(`
    SELECT 
      strftime('%Y-%m', purchase_date) as month,
      SUM(total_amount) as purchases
    FROM PurchaseSpend
    WHERE purchase_date >= date('now', '-6 months')
    GROUP BY month
  `).all();

  // Merge monthly data
  const months = new Set([...monthlyPL.map(m => m.month), ...monthlyExp.map(m => m.month), ...monthlyPur.map(m => m.month)]);
  const monthlyComparison = Array.from(months).sort().map(month => {
    const income = monthlyPL.find(m => m.month === month)?.income || 0;
    const expenses = monthlyExp.find(m => m.month === month)?.expenses || 0;
    const purchases = monthlyPur.find(m => m.month === month)?.purchases || 0;
    return {
      month,
      income,
      expenses,
      purchases,
      profit: income - expenses - purchases
    };
  });

  res.json({
    last30DaysIncome,
    expenseDistribution,
    monthlyComparison
  });
});

router.get('/yearly', (req, res) => {
  const monthlyPL = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(amount) as income
    FROM DailyIncome
    GROUP BY month
  `).all();

  const monthlyExp = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(amount) as expenses
    FROM Expenses
    GROUP BY month
  `).all();

  const monthlyPur = db.prepare(`
    SELECT 
      strftime('%Y-%m', purchase_date) as month,
      SUM(total_amount) as purchases
    FROM PurchaseSpend
    GROUP BY month
  `).all();

  const months = new Set([...monthlyPL.map((m: any) => m.month), ...monthlyExp.map((m: any) => m.month), ...monthlyPur.map((m: any) => m.month)]);
  const yearlyData = Array.from(months).sort((a: any, b: any) => b.localeCompare(a)).map(month => {
    const income = (monthlyPL.find((m: any) => m.month === month) as any)?.income || 0;
    const expenses = (monthlyExp.find((m: any) => m.month === month) as any)?.expenses || 0;
    const purchases = (monthlyPur.find((m: any) => m.month === month) as any)?.purchases || 0;
    return {
      month,
      income,
      expenses,
      purchases,
      profit: income - expenses - purchases
    };
  });

  res.json(yearlyData);
});

export default router;
