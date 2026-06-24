const mysql = require('mysql2/promise');

async function makeAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '4FaYrZTe4mNxiCA.root',
      password: 'vAj1Xdwc6p9WwBHf',
      database: 'income_tax_db',
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      }
    });

    console.log('Connected to TiDB...');

    const [result] = await connection.query(
      "UPDATE users SET role='admin' WHERE email='techyharsh454@gmail.com'"
    );
    
    console.log(`Updated ${result.affectedRows} rows.`);
    
    await connection.end();
  } catch (error) {
    console.error('Failed:', error);
  }
}

makeAdmin();
