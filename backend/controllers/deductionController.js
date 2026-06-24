const db = require('../config/db');

const DEDUCTION_LIMITS = {
  '80C': 150000,
  '80D': 25000,
  '80E': null,       // No limit for education loan interest
  '80G': null,
  'HRA': null,       // Calculated separately
  'Standard': 50000, // Standard deduction for salaried
  '80TTA': 10000,
  '80CCD': 50000,    // NPS additional
};

const getDeductions = async (req, res) => {
  try {
    const { financial_year_id } = req.query;
    let query = `
      SELECT d.*, fy.year_label
      FROM deductions d
      JOIN financial_years fy ON d.financial_year_id = fy.id
      WHERE d.user_id = ?
    `;
    const params = [req.user.id];
    if (financial_year_id) {
      query += ' AND d.financial_year_id = ?';
      params.push(financial_year_id);
    }
    query += ' ORDER BY d.section';
    const [rows] = await db.query(query, params);
    res.json({ deductions: rows, limits: DEDUCTION_LIMITS });
  } catch (err) {
    console.error('Get deductions error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const addDeduction = async (req, res) => {
  try {
    const { financial_year_id, section, description, amount } = req.body;
    if (!financial_year_id || !section || amount === undefined) {
      return res.status(400).json({ message: 'financial_year_id, section, and amount are required.' });
    }
    const max_limit = DEDUCTION_LIMITS[section] || null;
    const effectiveAmount = max_limit ? Math.min(parseFloat(amount), max_limit) : parseFloat(amount);

    const [result] = await db.query(
      `INSERT INTO deductions (user_id, financial_year_id, section, description, amount, max_limit)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, financial_year_id, section, description || null, effectiveAmount, max_limit]
    );
    res.status(201).json({ message: 'Deduction added.', id: result.insertId, effective_amount: effectiveAmount });
  } catch (err) {
    console.error('Add deduction error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { section, description, amount } = req.body;
    const max_limit = DEDUCTION_LIMITS[section] || null;
    const effectiveAmount = max_limit ? Math.min(parseFloat(amount), max_limit) : parseFloat(amount);

    const [result] = await db.query(
      `UPDATE deductions SET section=?, description=?, amount=?, max_limit=? WHERE id=? AND user_id=?`,
      [section, description, effectiveAmount, max_limit, id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Deduction not found.' });
    res.json({ message: 'Deduction updated.' });
  } catch (err) {
    console.error('Update deduction error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM deductions WHERE id=? AND user_id=?', [id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Deduction not found.' });
    res.json({ message: 'Deduction deleted.' });
  } catch (err) {
    console.error('Delete deduction error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getDeductions, addDeduction, updateDeduction, deleteDeduction };
