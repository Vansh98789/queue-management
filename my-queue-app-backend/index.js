import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Register user
app.post('/users/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users(username, password) VALUES($1, $2) RETURNING *',
      [username, password]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Username may already exist' });
  }
});

// Login
app.post('/users/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a queue
app.post('/queues', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO queues(name) VALUES($1) RETURNING *',
      [name]
    );
    res.json({ success: true, queue: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create queue' });
  }
});

// Get all queues
app.get('/queues', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM queues');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch queues' });
  }
});

// Add token to queue
app.post('/queues/:id/tokens', async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'INSERT INTO tokens(name, queue_id) VALUES($1, $2) RETURNING *',
      [name, id]
    );
    res.json({ success: true, token: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add token' });
  }
});

// Get tokens in a queue
app.get('/queues/:id/tokens', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM tokens WHERE queue_id = $1 AND status = $2 ORDER BY id',
      [id, 'waiting']
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tokens' });
  }
});

// Assign top token
app.put('/queues/:id/assign', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE tokens SET status = $1 WHERE id = (
         SELECT id FROM tokens WHERE queue_id = $2 AND status = $3 ORDER BY id LIMIT 1
       ) RETURNING *`,
      ['assigned', id, 'waiting']
    );
    res.json({ success: true, token: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to assign token' });
  }
});

// Cancel token
app.delete('/tokens/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE tokens SET status = $1 WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );
    res.json({ success: true, token: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel token' });
  }
});

// Analytics
app.get('/analytics', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT queue_id, COUNT(*) as total FROM tokens GROUP BY queue_id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
