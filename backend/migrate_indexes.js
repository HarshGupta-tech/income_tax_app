const db = require('./config/db');

async function migrateIndexes() {
  console.log('Starting index migration...');
  
  const queries = [
    "CREATE INDEX idx_users_role ON users(role);",
    "CREATE INDEX idx_income_user_created ON income_sources(user_id, created_at);",
    "CREATE INDEX idx_deductions_user_created ON deductions(user_id, created_at);",
    "CREATE INDEX idx_tax_calc_user_calc_date ON tax_calculations(user_id, calculated_at);"
  ];

  for (const query of queries) {
    try {
      console.log(`Executing: ${query}`);
      await db.query(query);
      console.log('✅ Success');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️ Index already exists, skipping.');
      } else {
        console.error('❌ Error executing query:', err.message);
      }
    }
  }

  console.log('Index migration complete.');
  process.exit(0);
}

migrateIndexes();
