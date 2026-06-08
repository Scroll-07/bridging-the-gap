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
  if (!pool) {
    let attempts = 0;
    while (attempts < 5) {
      try {
        pool = await sql.connect(config);
        console.log('Database connected successfully');
        return pool;
      } catch (err) {
        attempts++;
        console.log(`DB connection attempt ${attempts} failed. Retrying in 5s...`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    throw new Error('Could not connect to database after 5 attempts');
  }
  return pool;
}

module.exports = { getPool, sql };