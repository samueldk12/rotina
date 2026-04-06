// api/auth/register.js — POST /api/auth/register
'use strict';

const bcrypt = require('bcryptjs');
const { getPool, initSchema } = require('../_db');
const { signToken } = require('../_auth');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { username, email, password, routineType } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e senha são obrigatórios' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username deve ter ao menos 3 caracteres' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' });
  }

  try {
    await initSchema();
    const pool = getPool();

    // Check if username already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username já está em uso' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username.toLowerCase().trim(), email?.toLowerCase().trim() || null, hash]
    );

    const user = result.rows[0];

    // Define initial overrides if starting "blank"
    let generalOverrides = '{}';
    if (routineType === 'blank') {
      const emptyDay = { studies: [], workout: { sheetId: "", focus: "", estimatedMin: 0 }, notes: "" };
      const blankData = {};
      for (let i = 0; i < 7; i++) blankData[i] = emptyDay;
      generalOverrides = JSON.stringify(blankData);
    }

    // Initialize user_data row
    await pool.query(
      `INSERT INTO user_data (user_id, general_overrides) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [user.id, generalOverrides]
    );

    const token = signToken({ userId: user.id, username: user.username });

    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
