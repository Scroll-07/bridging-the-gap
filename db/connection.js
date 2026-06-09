const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 60000,
    requestTimeout: 60000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

async function getPool() {
  if (pool) return pool;
  
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`DB connection attempt ${attempts + 1}...`);
      pool = await sql.connect(config);
      console.log('DB connected successfully');
      return pool;
    } catch (err) {
      attempts++;
      console.error(`DB attempt ${attempts} failed:`, err.message);
      if (attempts >= maxAttempts) throw err;
      // Wait before retrying — gives Azure time to wake up
      await new Promise(resolve => setTimeout(resolve, 5000 * attempts));
    }
  }
}

// Reset pool on error so next request tries fresh
sql.on('error', err => {
  console.error('SQL pool error:', err);
  pool = null;
});

module.exports = { getPool, sql };