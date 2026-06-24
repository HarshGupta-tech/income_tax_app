# 🧾 TaxFlow – Income Tax Management System

A full-stack income tax management web application built with **React**, **Node.js/Express**, and **MySQL**.

---

## 📁 Project Structure

```
income-tax-app/
├── backend/                  # Node.js + Express API
│   ├── config/
│   │   ├── db.js             # MySQL connection pool
│   │   └── init.sql          # Database schema (run once)
│   ├── controllers/
│   │   ├── authController.js     # Register, login, profile
│   │   ├── incomeController.js   # Income CRUD
│   │   ├── deductionController.js # Deductions CRUD
│   │   └── taxController.js      # Tax calculation engine
│   ├── middleware/
│   │   └── auth.js           # JWT middleware
│   ├── routes/
│   │   └── index.js          # All API routes
│   ├── server.js             # Express entry point
│   ├── .env.example          # Copy to .env and fill in
│   └── package.json
│
└── frontend/                 # React app
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── Auth/
        │   │   ├── Login.js
        │   │   └── Register.js
        │   ├── Dashboard/
        │   │   ├── Dashboard.js      # Overview + charts
        │   │   ├── Sidebar.js        # Navigation
        │   │   ├── TaxCalculator.js  # Tax slab calculator
        │   │   └── Profile.js
        │   ├── Income/
        │   │   ├── Income.js         # Income CRUD
        │   │   └── Deductions.js     # Deductions CRUD
        │   └── Reports/
        │       └── Reports.js        # Charts & analytics
        ├── context/
        │   └── AuthContext.js        # Global auth state
        ├── pages/
        │   └── ProtectedRoute.js
        ├── utils/
        │   ├── api.js                # Axios instance + interceptors
        │   └── helpers.js            # Formatters + constants
        ├── App.js
        ├── index.js
        └── index.css                 # Design system
```

---

## ⚙️ Setup Instructions

### 1. MySQL Database

```bash
# Log in to MySQL
mysql -u root -p

# Run the schema file
source /path/to/backend/config/init.sql
```

### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your MySQL credentials
nano .env

# Start in development mode
npm run dev
# → Runs on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start React app
npm start
# → Runs on http://localhost:3000
```

---

## 🌐 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile (auth) |
| PUT | `/api/auth/profile` | Update profile (auth) |
| GET | `/api/financial-years` | List financial years |
| GET | `/api/income` | List income sources |
| POST | `/api/income` | Add income |
| PUT | `/api/income/:id` | Update income |
| DELETE | `/api/income/:id` | Delete income |
| GET | `/api/deductions` | List deductions |
| POST | `/api/deductions` | Add deduction |
| PUT | `/api/deductions/:id` | Update deduction |
| DELETE | `/api/deductions/:id` | Delete deduction |
| POST | `/api/tax/calculate` | Calculate tax |
| GET | `/api/tax/history` | Tax history |
| GET | `/api/tax/dashboard` | Dashboard summary |

---

## 💡 Features

- **JWT Authentication** – Secure login/register
- **Income Sources** – Salary, Business, Capital Gains, Rental, Other
- **Deductions** – 80C, 80D, 80E, HRA, Standard Deduction, etc.
- **Tax Calculator** – Old & New regime, Indian tax slabs (FY 2024-25)
  - Surcharge calculation
  - 4% Health & Education Cess
  - Section 87A rebate (New regime ≤ ₹7L)
- **Reports** – Bar, Pie & Line charts with Recharts
- **Multi-year support** – Track FY 2022-23 through FY 2025-26

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Charts | Recharts |
| HTTP Client | Axios |
| Backend | Node.js, Express |
| Database | MySQL 8+ |
| ORM | mysql2 (native driver) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
