const db = require('../config/db');

// --- Tax Slab Logic (India FY 2024-25) ---

function calculateOldRegimeTax(taxableIncome) {
  let tax = 0;
  if (taxableIncome <= 250000) tax = 0;
  else if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05;
  else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.20;
  else tax = 112500 + (taxableIncome - 1000000) * 0.30;
  return tax;
}

function calculateNewRegimeTax(taxableIncome) {
  // New regime FY 2024-25 (post Budget 2023)
  let tax = 0;
  if (taxableIncome <= 300000) tax = 0;
  else if (taxableIncome <= 700000) tax = (taxableIncome - 300000) * 0.05;
  else if (taxableIncome <= 1000000) tax = 20000 + (taxableIncome - 700000) * 0.10;
  else if (taxableIncome <= 1200000) tax = 50000 + (taxableIncome - 1000000) * 0.15;
  else if (taxableIncome <= 1500000) tax = 80000 + (taxableIncome - 1200000) * 0.20;
  else tax = 140000 + (taxableIncome - 1500000) * 0.30;
  return tax;
}

function calculateSurcharge(income, basicTax) {
  if (income <= 5000000) return 0;
  if (income <= 10000000) return basicTax * 0.10;
  if (income <= 20000000) return basicTax * 0.15;
  if (income <= 50000000) return basicTax * 0.25;
  return basicTax * 0.37;
}

// Main calculation endpoint
const calculateTax = async (req, res) => {
  try {
    const { financial_year_id, tax_regime } = req.body;
    const regime = tax_regime || 'new';

    if (!financial_year_id) {
      return res.status(400).json({ message: 'financial_year_id is required.' });
    }

    // Sum all income
    const [incomeRows] = await db.query(
      `SELECT source_type, SUM(amount) as total FROM income_sources
       WHERE user_id=? AND financial_year_id=? GROUP BY source_type`,
      [req.user.id, financial_year_id]
    );

    const totalIncome = incomeRows.reduce((sum, r) => sum + parseFloat(r.total), 0);

    // Sum all deductions
    const [deductionRows] = await db.query(
      `SELECT section, SUM(amount) as total FROM deductions
       WHERE user_id=? AND financial_year_id=? GROUP BY section`,
      [req.user.id, financial_year_id]
    );

    const totalDeductions = regime === 'old'
      ? deductionRows.reduce((sum, r) => sum + parseFloat(r.total), 0)
      : 0; // New regime doesn't allow most deductions

    const taxableIncome = Math.max(0, totalIncome - totalDeductions);

    let basicTax = 0;
    if (regime === 'old') {
      basicTax = calculateOldRegimeTax(taxableIncome);
    } else {
      basicTax = calculateNewRegimeTax(taxableIncome);
      // Rebate u/s 87A for new regime (income <= 7L)
      if (taxableIncome <= 700000) basicTax = 0;
    }

    const surcharge = calculateSurcharge(taxableIncome, basicTax);
    const cess = (basicTax + surcharge) * 0.04; // 4% Health & Education cess
    const totalTax = basicTax + surcharge + cess;

    // Upsert into tax_calculations
    await db.query(
      `INSERT INTO tax_calculations
         (user_id, financial_year_id, total_income, total_deductions, taxable_income,
          tax_regime, basic_tax, surcharge, cess, total_tax)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         total_income=VALUES(total_income),
         total_deductions=VALUES(total_deductions),
         taxable_income=VALUES(taxable_income),
         tax_regime=VALUES(tax_regime),
         basic_tax=VALUES(basic_tax),
         surcharge=VALUES(surcharge),
         cess=VALUES(cess),
         total_tax=VALUES(total_tax),
         calculated_at=CURRENT_TIMESTAMP`,
      [req.user.id, financial_year_id, totalIncome, totalDeductions,
       taxableIncome, regime, basicTax, surcharge, cess, totalTax]
    );

    // Build slab breakdown
    const slabBreakdown = regime === 'new'
      ? [
          { slab: 'Up to ₹3,00,000', rate: '0%', tax: 0 },
          { slab: '₹3,00,001 – ₹7,00,000', rate: '5%', tax: taxableIncome > 300000 ? Math.min(taxableIncome - 300000, 400000) * 0.05 : 0 },
          { slab: '₹7,00,001 – ₹10,00,000', rate: '10%', tax: taxableIncome > 700000 ? Math.min(taxableIncome - 700000, 300000) * 0.10 : 0 },
          { slab: '₹10,00,001 – ₹12,00,000', rate: '15%', tax: taxableIncome > 1000000 ? Math.min(taxableIncome - 1000000, 200000) * 0.15 : 0 },
          { slab: '₹12,00,001 – ₹15,00,000', rate: '20%', tax: taxableIncome > 1200000 ? Math.min(taxableIncome - 1200000, 300000) * 0.20 : 0 },
          { slab: 'Above ₹15,00,000', rate: '30%', tax: taxableIncome > 1500000 ? (taxableIncome - 1500000) * 0.30 : 0 },
        ]
      : [
          { slab: 'Up to ₹2,50,000', rate: '0%', tax: 0 },
          { slab: '₹2,50,001 – ₹5,00,000', rate: '5%', tax: taxableIncome > 250000 ? Math.min(taxableIncome - 250000, 250000) * 0.05 : 0 },
          { slab: '₹5,00,001 – ₹10,00,000', rate: '20%', tax: taxableIncome > 500000 ? Math.min(taxableIncome - 500000, 500000) * 0.20 : 0 },
          { slab: 'Above ₹10,00,000', rate: '30%', tax: taxableIncome > 1000000 ? (taxableIncome - 1000000) * 0.30 : 0 },
        ];

    res.json({
      calculation: {
        total_income: totalIncome,
        total_deductions: totalDeductions,
        taxable_income: taxableIncome,
        tax_regime: regime,
        basic_tax: basicTax,
        surcharge,
        cess,
        total_tax: totalTax,
        income_breakdown: incomeRows,
        deduction_breakdown: deductionRows,
        slab_breakdown: slabBreakdown,
      },
    });
  } catch (err) {
    console.error('Tax calculation error:', err);
    res.status(500).json({ message: 'Server error during tax calculation.' });
  }
};

// Get saved calculation
const getSavedCalculation = async (req, res) => {
  try {
    const { financial_year_id } = req.query;
    let query = `
      SELECT tc.*, fy.year_label
      FROM tax_calculations tc
      JOIN financial_years fy ON tc.financial_year_id = fy.id
      WHERE tc.user_id = ?
    `;
    const params = [req.user.id];
    if (financial_year_id) {
      query += ' AND tc.financial_year_id = ?';
      params.push(financial_year_id);
    }
    query += ' ORDER BY tc.calculated_at DESC';
    const [rows] = await db.query(query, params);
    res.json({ calculations: rows });
  } catch (err) {
    console.error('Get calculation error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Summary for dashboard
const getDashboardSummary = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT tc.*, fy.year_label
       FROM tax_calculations tc
       JOIN financial_years fy ON tc.financial_year_id = fy.id
       WHERE tc.user_id = ?
       ORDER BY fy.start_date DESC LIMIT 4`,
      [req.user.id]
    );
    res.json({ summary: rows });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { calculateTax, getSavedCalculation, getDashboardSummary };
