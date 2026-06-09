if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const submissionsRouter = require('./routes/submissions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/submissions', submissionsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for all other routes
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Keep Azure DB awake — ping every 4 minutes
const keepAlive = async () => {
  try {
    const { getPool } = require('./db/connection');
    const pool = await getPool();
    await pool.request().query('SELECT 1');
    console.log('DB keep-alive ping sent');
  } catch (err) {
    console.error('Keep-alive failed:', err.message);
  }
};

// Start pinging after 30 seconds, then every 4 minutes
setTimeout(() => {
  keepAlive();
  setInterval(keepAlive, 4 * 60 * 1000);
}, 30000);

app.listen(PORT, () => {
  console.log(`🌉 Bridging The Gap server running on port ${PORT}`);
});