import express from 'express';
import { db } from '../db.js';
import { authenticate } from './auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);

    // Today Income
    const todayIncomeRes = await db.query('SELECT SUM(amount) as total FROM DailyIncome WHERE date = $1', [today]);
    const todayIncome = parseFloat(todayIncomeRes.rows[0].total) || 0;

    // Today Expenses
    const todayExpensesRes = await db.query('SELECT SUM(amount) as total FROM Expenses WHERE date = $1', [today]);
    const todayExpenses = parseFloat(todayExpensesRes.rows[0].total) || 0;

    // Monthly Income
    const monthlyIncomeRes = await db.query('SELECT SUM(amount) as total FROM DailyIncome WHERE date LIKE $1', [`${currentMonth}%`]);
    const monthlyIncome = parseFloat(monthlyIncomeRes.rows[0].total) || 0;

    // Monthly Expenses
    const monthlyExpensesRes = await db.query('SELECT SUM(amount) as total FROM Expenses WHERE date LIKE $1', [`${currentMonth}%`]);
    const monthlyExpenses = parseFloat(monthlyExpensesRes.rows[0].total) || 0;

    // Monthly Purchases
    const monthlyPurchasesRes = await db.query('SELECT SUM(total_amount) as total FROM PurchaseSpend WHERE purchase_date LIKE $1', [`${currentMonth}%`]);
    const monthlyPurchases = parseFloat(monthlyPurchasesRes.rows[0].total) || 0;

    // Monthly Profit
    const monthlyProfit = monthlyIncome - monthlyExpenses - monthlyPurchases;

    // Total Inventory Value
    const inventoryValueRes = await db.query('SELECT SUM(purchase_price * quantity) as total FROM Products');
    const inventoryValue = parseFloat(inventoryValueRes.rows[0].total) || 0;

    // Pending Udhar
    const totalUdharRes = await db.query("SELECT SUM(amount) as total FROM UdharLedger WHERE status = 'PENDING'");
    const totalUdhar = parseFloat(totalUdharRes.rows[0].total) || 0;

    const totalPaidUdharRes = await db.query(`
      SELECT SUM(p.amount) as total 
      FROM UdharPayments p 
      JOIN UdharLedger u ON p.udhar_id = u.id 
      WHERE u.status = 'PENDING'
    `);
    const totalPaidUdhar = parseFloat(totalPaidUdharRes.rows[0].total) || 0;
    const pendingUdhar = totalUdhar - totalPaidUdhar;

    res.json({
      todayIncome,
      todayExpenses,
      monthlyProfit,
      monthlyPurchases,
      inventoryValue,
      pendingUdhar
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/charts', async (req, res) => {
  try {
    // Last 30 days income
    const last30DaysIncomeRes = await db.query(`
      SELECT date, SUM(amount) as total 
      FROM DailyIncome 
      WHERE TO_DATE(date, 'YYYY-MM-DD') >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY date 
      ORDER BY date ASC
    `);
    const last30DaysIncome = last30DaysIncomeRes.rows.map(r => ({ ...r, total: parseFloat(r.total) }));

    // Expense distribution
    const expenseDistributionRes = await db.query(`
      SELECT category as name, SUM(amount) as value 
      FROM Expenses 
      GROUP BY category
    `);
    const expenseDistribution = expenseDistributionRes.rows.map(r => ({ ...r, value: parseFloat(r.value) }));

    // Monthly P/L comparison (last 6 months)
    const monthlyPLRes = await db.query(`
      SELECT 
        TO_CHAR(TO_DATE(date, 'YYYY-MM-DD'), 'YYYY-MM') as month,
        SUM(amount) as income
      FROM DailyIncome
      WHERE TO_DATE(date, 'YYYY-MM-DD') >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month
    `);
    const monthlyPL = monthlyPLRes.rows.map(r => ({ ...r, income: parseFloat(r.income) }));

    const monthlyExpRes = await db.query(`
      SELECT 
        TO_CHAR(TO_DATE(date, 'YYYY-MM-DD'), 'YYYY-MM') as month,
        SUM(amount) as expenses
      FROM Expenses
      WHERE TO_DATE(date, 'YYYY-MM-DD') >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month
    `);
    const monthlyExp = monthlyExpRes.rows.map(r => ({ ...r, expenses: parseFloat(r.expenses) }));

    const monthlyPurRes = await db.query(`
      SELECT 
        TO_CHAR(TO_DATE(purchase_date, 'YYYY-MM-DD'), 'YYYY-MM') as month,
        SUM(total_amount) as purchases
      FROM PurchaseSpend
      WHERE TO_DATE(purchase_date, 'YYYY-MM-DD') >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month
    `);
    const monthlyPur = monthlyPurRes.rows.map(r => ({ ...r, purchases: parseFloat(r.purchases) }));

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
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/yearly', async (req, res) => {
  try {
    const monthlyPLRes = await db.query(`
      SELECT 
        TO_CHAR(TO_DATE(date, 'YYYY-MM-DD'), 'YYYY-MM') as month,
        SUM(amount) as income
      FROM DailyIncome
      GROUP BY month
    `);
    const monthlyPL = monthlyPLRes.rows.map(r => ({ ...r, income: parseFloat(r.income) }));

    const monthlyExpRes = await db.query(`
      SELECT 
        TO_CHAR(TO_DATE(date, 'YYYY-MM-DD'), 'YYYY-MM') as month,
        SUM(amount) as expenses
      FROM Expenses
      GROUP BY month
    `);
    const monthlyExp = monthlyExpRes.rows.map(r => ({ ...r, expenses: parseFloat(r.expenses) }));

    const monthlyPurRes = await db.query(`
      SELECT 
        TO_CHAR(TO_DATE(purchase_date, 'YYYY-MM-DD'), 'YYYY-MM') as month,
        SUM(total_amount) as purchases
      FROM PurchaseSpend
      GROUP BY month
    `);
    const monthlyPur = monthlyPurRes.rows.map(r => ({ ...r, purchases: parseFloat(r.purchases) }));

    const months = new Set([...monthlyPL.map(m => m.month), ...monthlyExp.map(m => m.month), ...monthlyPur.map(m => m.month)]);
    const yearlyData = Array.from(months).sort((a: any, b: any) => b.localeCompare(a)).map(month => {
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

    res.json(yearlyData);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
