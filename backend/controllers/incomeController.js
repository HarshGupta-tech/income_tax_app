const db = require('../config/db');

// Get all income sources for a user + financial year
const getIncomeSources = async (req, res) => {
  try {
    const { financial_year_id } = req.query;
    let query = `
      SELECT i.*, fy.year_label
      FROM income_sources i
      JOIN financial_years fy ON i.financial_year_id = fy.id
      WHERE i.user_id = ?
    `;
    const params = [req.user.id];
    if (financial_year_id) {
      query += ' AND i.financial_year_id = ?';
      params.push(financial_year_id);
    }
    query += ' ORDER BY i.created_at DESC';
    const [rows] = await db.query(query, params);
    res.json({ income_sources: rows });
  } catch (err) {
    console.error('Get income error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Add income source
const addIncomeSource = async (req, res) => {
  try {
    const { financial_year_id, source_type, description, amount } = req.body;
    if (!financial_year_id || !source_type || amount === undefined) {
      return res.status(400).json({ message: 'financial_year_id, source_type, and amount are required.' });
    }
    const [result] = await db.query(
      `INSERT INTO income_sources (user_id, financial_year_id, source_type, description, amount)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, financial_year_id, source_type, description || null, amount]
    );
    res.status(201).json({ message: 'Income source added.', id: result.insertId });
  } catch (err) {
    console.error('Add income error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update income source
const updateIncomeSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { source_type, description, amount } = req.body;
    const [result] = await db.query(
      `UPDATE income_sources SET source_type=?, description=?, amount=?
       WHERE id=? AND user_id=?`,
      [source_type, description, amount, id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Income source not found.' });
    res.json({ message: 'Income source updated.' });
  } catch (err) {
    console.error('Update income error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete income source
const deleteIncomeSource = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      'DELETE FROM income_sources WHERE id=? AND user_id=?',
      [id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Income source not found.' });
    res.json({ message: 'Income source deleted.' });
  } catch (err) {
    console.error('Delete income error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all financial years
const getFinancialYears = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM financial_years ORDER BY start_date DESC');
    res.json({ financial_years: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getIncomeSources, addIncomeSource, updateIncomeSource, deleteIncomeSource, getFinancialYears };
