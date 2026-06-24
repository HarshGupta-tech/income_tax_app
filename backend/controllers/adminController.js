const db = require('../config/db');

// --- Admin Dashboard Stats ---
const getDashboardStats = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ adminUsers }]] = await db.query("SELECT COUNT(*) as adminUsers FROM users WHERE role = 'admin'");

    const [[{ totalIncome }]] = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as totalIncome FROM income_sources'
    );
    const [[{ totalTax }]] = await db.query(
      'SELECT COALESCE(SUM(total_tax), 0) as totalTax FROM tax_calculations'
    );
    const [[{ totalCalculations }]] = await db.query(
      'SELECT COUNT(*) as totalCalculations FROM tax_calculations'
    );

    // Per-FY breakdown
    const [fyBreakdown] = await db.query(`
      SELECT fy.year_label,
             COUNT(DISTINCT tc.user_id) as users,
             COALESCE(SUM(tc.total_income), 0) as total_income,
             COALESCE(SUM(tc.total_tax), 0) as total_tax
      FROM financial_years fy
      LEFT JOIN tax_calculations tc ON tc.financial_year_id = fy.id
      GROUP BY fy.id, fy.year_label
      ORDER BY fy.start_date DESC
    `);

    // Recent registrations (last 10)
    const [recentUsers] = await db.query(
      'SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );

    // Regime split
    const [regimeSplit] = await db.query(`
      SELECT tax_regime, COUNT(*) as count, COALESCE(SUM(total_tax), 0) as total_tax
      FROM tax_calculations
      GROUP BY tax_regime
    `);

    res.json({
      stats: {
        totalUsers,
        adminUsers,
        totalIncome: parseFloat(totalIncome),
        totalTax: parseFloat(totalTax),
        totalCalculations,
      },
      fyBreakdown,
      recentUsers,
      regimeSplit,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Get All Users (paginated, searchable) ---
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Whitelist allowed sort columns
    const allowedSorts = ['full_name', 'email', 'created_at', 'role'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let whereClause = '';
    const params = [];
    if (search) {
      whereClause = 'WHERE full_name LIKE ? OR email LIKE ? OR pan_number LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`, params
    );

    const [users] = await db.query(
      `SELECT id, full_name, email, pan_number, phone, role, created_at
       FROM users ${whereClause}
       ORDER BY ${sortCol} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Get Single User Details ---
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [userRows] = await db.query(
      'SELECT id, full_name, email, pan_number, phone, date_of_birth, address, role, created_at FROM users WHERE id = ?',
      [id]
    );
    if (userRows.length === 0) return res.status(404).json({ message: 'User not found.' });

    const user = userRows[0];

    // Income sources
    const [income] = await db.query(`
      SELECT i.*, fy.year_label FROM income_sources i
      JOIN financial_years fy ON i.financial_year_id = fy.id
      WHERE i.user_id = ? ORDER BY i.created_at DESC
    `, [id]);

    // Deductions
    const [deductions] = await db.query(`
      SELECT d.*, fy.year_label FROM deductions d
      JOIN financial_years fy ON d.financial_year_id = fy.id
      WHERE d.user_id = ? ORDER BY d.created_at DESC
    `, [id]);

    // Tax calculations
    const [calculations] = await db.query(`
      SELECT tc.*, fy.year_label FROM tax_calculations tc
      JOIN financial_years fy ON tc.financial_year_id = fy.id
      WHERE tc.user_id = ? ORDER BY tc.calculated_at DESC
    `, [id]);

    res.json({ user, income, deductions, calculations });
  } catch (err) {
    console.error('Admin get user detail error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Delete User ---
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account.' });
    }

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Get All Tax Calculations (admin view) ---
const getAllTaxCalculations = async (req, res) => {
  try {
    const { financial_year_id, tax_regime, search = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];

    let whereClause = 'WHERE 1=1';
    if (financial_year_id) {
      whereClause += ' AND tc.financial_year_id = ?';
      params.push(financial_year_id);
    }
    if (tax_regime) {
      whereClause += ' AND tc.tax_regime = ?';
      params.push(tax_regime);
    }
    if (search) {
      whereClause += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM tax_calculations tc
       JOIN users u ON tc.user_id = u.id ${whereClause}`, params
    );

    const [calculations] = await db.query(
      `SELECT tc.*, fy.year_label, u.full_name, u.email
       FROM tax_calculations tc
       JOIN financial_years fy ON tc.financial_year_id = fy.id
       JOIN users u ON tc.user_id = u.id
       ${whereClause}
       ORDER BY tc.calculated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      calculations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Admin get calculations error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Financial Years Management ---
const getFinancialYears = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM financial_years ORDER BY start_date DESC');
    res.json({ financial_years: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const addFinancialYear = async (req, res) => {
  try {
    const { year_label, start_date, end_date } = req.body;
    if (!year_label || !start_date || !end_date) {
      return res.status(400).json({ message: 'year_label, start_date, and end_date are required.' });
    }
    const [result] = await db.query(
      'INSERT INTO financial_years (year_label, start_date, end_date) VALUES (?, ?, ?)',
      [year_label, start_date, end_date]
    );
    res.status(201).json({ message: 'Financial year added.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Financial year already exists.' });
    }
    console.error('Add FY error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateFinancialYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { year_label, start_date, end_date } = req.body;
    const [result] = await db.query(
      'UPDATE financial_years SET year_label=?, start_date=?, end_date=? WHERE id=?',
      [year_label, start_date, end_date, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Financial year not found.' });
    res.json({ message: 'Financial year updated.' });
  } catch (err) {
    console.error('Update FY error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Update User Role ---
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    if (parseInt(id) === req.user.id && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot demote yourself.' });
    }

    const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: `User role updated to ${role}.` });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Create User/Admin Directly ---
const bcrypt = require('bcryptjs');
const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }
    
    const userRole = ['user', 'admin'].includes(role) ? role : 'user';

    // Check if email exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)`,
      [full_name, email, hashedPassword, userRole]
    );

    res.status(201).json({ message: 'User created successfully.', id: result.insertId });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  deleteUser,
  updateUserRole,
  createUser,
  getAllTaxCalculations,
  getFinancialYears,
  addFinancialYear,
  updateFinancialYear,
};
