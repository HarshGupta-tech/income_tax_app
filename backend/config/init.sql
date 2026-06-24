-- Income Tax Management Database Schema
-- Run this file to set up the database: mysql -u root -p < init.sql

CREATE DATABASE IF NOT EXISTS income_tax_db;
USE income_tax_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  pan_number VARCHAR(10) UNIQUE,
  phone VARCHAR(15),
  date_of_birth DATE,
  address TEXT,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Financial years table (lookup)
CREATE TABLE IF NOT EXISTS financial_years (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year_label VARCHAR(10) NOT NULL UNIQUE,  -- e.g. '2024-25'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);

INSERT IGNORE INTO financial_years (year_label, start_date, end_date) VALUES
  ('2022-23', '2022-04-01', '2023-03-31'),
  ('2023-24', '2023-04-01', '2024-03-31'),
  ('2024-25', '2024-04-01', '2025-03-31'),
  ('2025-26', '2025-04-01', '2026-03-31');

-- Income sources table
CREATE TABLE IF NOT EXISTS income_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  financial_year_id INT NOT NULL,
  source_type ENUM('salary','business','capital_gains','rental','other') NOT NULL,
  description VARCHAR(255),
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (financial_year_id) REFERENCES financial_years(id)
);

-- Deductions table (80C, 80D, HRA, etc.)
CREATE TABLE IF NOT EXISTS deductions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  financial_year_id INT NOT NULL,
  section VARCHAR(20) NOT NULL,         -- e.g. '80C', '80D', 'HRA'
  description VARCHAR(255),
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  max_limit DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (financial_year_id) REFERENCES financial_years(id)
);

-- Tax calculations table (stores computed results)
CREATE TABLE IF NOT EXISTS tax_calculations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  financial_year_id INT NOT NULL,
  total_income DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_deductions DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  taxable_income DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  tax_regime ENUM('old', 'new') DEFAULT 'new',
  basic_tax DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  surcharge DECIMAL(15, 2) DEFAULT 0.00,
  cess DECIMAL(15, 2) DEFAULT 0.00,
  total_tax DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (financial_year_id) REFERENCES financial_years(id),
  UNIQUE KEY unique_user_fy (user_id, financial_year_id)
);

-- Indexes for performance
CREATE INDEX idx_income_user_fy ON income_sources(user_id, financial_year_id);
CREATE INDEX idx_deductions_user_fy ON deductions(user_id, financial_year_id);
CREATE INDEX idx_tax_calc_user_fy ON tax_calculations(user_id, financial_year_id);
