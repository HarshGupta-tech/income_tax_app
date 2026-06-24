const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register new user
const register = async (req, res) => {
  try {
    const { full_name, email, password, pan_number, phone, date_of_birth, address } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    // Check if email exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Check PAN if provided
    if (pan_number) {
      const [panExists] = await db.query('SELECT id FROM users WHERE pan_number = ?', [pan_number]);
      if (panExists.length > 0) {
        return res.status(409).json({ message: 'PAN number already registered.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO users (full_name, email, password, pan_number, phone, date_of_birth, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, hashedPassword, pan_number || null, phone || null, date_of_birth || null, address || null]
    );

    const token = jwt.sign(
      { id: result.insertId, email, full_name, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: { id: result.insertId, full_name, email, pan_number, role: 'user' },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        pan_number: user.pan_number,
        phone: user.phone,
        role: user.role || 'user',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// Get profile
const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, full_name, email, pan_number, phone, date_of_birth, address, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, date_of_birth, address, pan_number } = req.body;
    await db.query(
      `UPDATE users SET full_name=?, phone=?, date_of_birth=?, address=?, pan_number=? WHERE id=?`,
      [full_name, phone, date_of_birth, address, pan_number, req.user.id]
    );
    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, getProfile, updateProfile };
